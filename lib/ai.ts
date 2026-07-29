import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/db";
import { formatAge } from "@/lib/format";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env to enable the AI assistant and insights.",
    );
  }
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

export const CLAUDE_MODEL = "claude-opus-5";

/** Builds a compact text summary of a baby's recent logs for use as LLM context. */
export async function summarizeBabyContext(babyId: string): Promise<string> {
  const baby = await prisma.baby.findUniqueOrThrow({ where: { id: babyId } });
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [feedings, sleeps, diapers, growth, milestones] = await Promise.all([
    prisma.feedingLog.findMany({
      where: { babyId, startedAt: { gte: since } },
      orderBy: { startedAt: "desc" },
      take: 30,
    }),
    prisma.sleepLog.findMany({
      where: { babyId, startedAt: { gte: since } },
      orderBy: { startedAt: "desc" },
      take: 30,
    }),
    prisma.diaperLog.findMany({
      where: { babyId, occurredAt: { gte: since } },
      orderBy: { occurredAt: "desc" },
      take: 30,
    }),
    prisma.growthLog.findMany({
      where: { babyId },
      orderBy: { measuredAt: "desc" },
      take: 5,
    }),
    prisma.milestone.findMany({
      where: { babyId },
      orderBy: { occurredAt: "desc" },
      take: 5,
    }),
  ]);

  const lines: string[] = [];
  lines.push(`Baby: ${baby.name}, ${formatAge(baby.dob)} (born ${baby.dob.toISOString().slice(0, 10)}).`);
  if (baby.notes) lines.push(`Notes: ${baby.notes}`);

  lines.push(`\nFeedings in last 7 days (${feedings.length} logged):`);
  for (const f of feedings.slice(0, 15)) {
    lines.push(
      `- ${f.startedAt.toISOString()}: ${f.type}${f.amountMl ? ` ${f.amountMl}ml` : ""}${f.durationMin ? ` ${f.durationMin}min` : ""}${f.side ? ` (${f.side})` : ""}`,
    );
  }

  lines.push(`\nSleep in last 7 days (${sleeps.length} logged):`);
  for (const s of sleeps.slice(0, 15)) {
    const durMin = s.endedAt ? Math.round((s.endedAt.getTime() - s.startedAt.getTime()) / 60000) : null;
    lines.push(`- ${s.startedAt.toISOString()}: ${s.type}${durMin ? ` (${durMin} min)` : " (ongoing)"}`);
  }

  lines.push(`\nDiapers in last 7 days (${diapers.length} logged):`);
  const diaperCounts = diapers.reduce<Record<string, number>>((acc, d) => {
    acc[d.type] = (acc[d.type] ?? 0) + 1;
    return acc;
  }, {});
  lines.push(`- ${Object.entries(diaperCounts).map(([k, v]) => `${k}: ${v}`).join(", ") || "none"}`);

  lines.push(`\nGrowth history (most recent first):`);
  for (const g of growth) {
    lines.push(
      `- ${g.measuredAt.toISOString().slice(0, 10)}: ${g.weightKg ? `${g.weightKg}kg ` : ""}${g.heightCm ? `${g.heightCm}cm ` : ""}${g.headCm ? `head ${g.headCm}cm` : ""}`,
    );
  }

  lines.push(`\nRecent milestones:`);
  for (const m of milestones) {
    lines.push(`- ${m.occurredAt.toISOString().slice(0, 10)}: ${m.title} (${m.category})`);
  }

  return lines.join("\n");
}
