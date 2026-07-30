import { prisma } from "@/lib/db";

export type PredictionResult = {
  eventType: "FEEDING" | "SLEEP";
  predictedTime: Date;
  confidence: number;
  basedOnEvents: number;
} | null;

/**
 * Rolling-average heuristic: mean interval between the last N same-type
 * events, projected forward from the most recent one. Deliberately simple
 * and deterministic — no LLM in this path. See PLANNING-iOS.md §4.
 */
function predictFromTimestamps(timestamps: Date[]): PredictionResult {
  const sorted = [...timestamps].sort((a, b) => b.getTime() - a.getTime()).slice(0, 7);
  if (sorted.length < 3) return null;

  const intervals: number[] = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    intervals.push(sorted[i].getTime() - sorted[i + 1].getTime());
  }

  const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
  const variance = intervals.reduce((a, b) => a + (b - mean) ** 2, 0) / intervals.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = mean > 0 ? stdDev / mean : 1;
  const confidence = Math.max(0.3, Math.min(0.95, 1 - coefficientOfVariation));

  return {
    eventType: "FEEDING", // overwritten by caller
    predictedTime: new Date(sorted[0].getTime() + mean),
    confidence: Math.round(confidence * 100) / 100,
    basedOnEvents: sorted.length,
  };
}

export async function predictNextFeeding(babyId: string): Promise<PredictionResult> {
  const logs = await prisma.feedingLog.findMany({
    where: { babyId },
    orderBy: { startedAt: "desc" },
    take: 7,
    select: { startedAt: true },
  });
  const result = predictFromTimestamps(logs.map((l) => l.startedAt));
  return result ? { ...result, eventType: "FEEDING" } : null;
}

export async function predictNextSleep(babyId: string): Promise<PredictionResult> {
  const logs = await prisma.sleepLog.findMany({
    where: { babyId },
    orderBy: { startedAt: "desc" },
    take: 7,
    select: { startedAt: true },
  });
  const result = predictFromTimestamps(logs.map((l) => l.startedAt));
  return result ? { ...result, eventType: "SLEEP" } : null;
}

/** Computes and persists both predictions for a baby (best-effort; nulls are skipped). */
export async function refreshPredictions(babyId: string) {
  const [feeding, sleep] = await Promise.all([
    predictNextFeeding(babyId),
    predictNextSleep(babyId),
  ]);

  await prisma.$transaction(
    [feeding, sleep]
      .filter((p): p is NonNullable<PredictionResult> => p !== null)
      .map((p) =>
        prisma.prediction.create({
          data: {
            babyId,
            eventType: p.eventType,
            predictedTime: p.predictedTime,
            confidence: p.confidence,
          },
        }),
      ),
  );

  return { feeding, sleep };
}
