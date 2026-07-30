import { prisma } from "@/lib/db";
import { differenceInCalendarDays } from "date-fns";

type TipBankEntry = {
  category: "SLEEP" | "FEEDING" | "DEVELOPMENT" | "SAFETY";
  content: string;
  ageDaysMin: number;
  ageDaysMax: number;
};

/**
 * Static tip bank tagged by age range in days. Not a substitute for
 * pediatric guidance — kept intentionally generic/safe. See
 * PLANNING-iOS.md for the "don't trust the LLM with medical claims" note;
 * this bank is hand-written, not LLM-generated.
 */
export const TIP_BANK: TipBankEntry[] = [
  { category: "SAFETY", content: "Always place your baby on their back to sleep, on a firm flat surface with nothing else in the crib.", ageDaysMin: 0, ageDaysMax: 365 },
  { category: "FEEDING", content: "Cluster feeding (frequent short feeds, often in the evening) is common and normal in the first few weeks — it's not necessarily a sign of low supply.", ageDaysMin: 0, ageDaysMax: 42 },
  { category: "DEVELOPMENT", content: "Daily tummy time (a few minutes, several times a day) while awake and supervised helps build neck and shoulder strength.", ageDaysMin: 7, ageDaysMax: 120 },
  { category: "SLEEP", content: "Reflux and gassiness often peak around 4-6 weeks and tend to improve by 3-4 months — mention frequent spit-up with poor weight gain or distress to your pediatrician.", ageDaysMin: 21, ageDaysMax: 56 },
  { category: "SLEEP", content: "Around 4 months, sleep patterns often shift (the '4-month sleep regression') as sleep cycles mature — it usually settles within a few weeks.", ageDaysMin: 105, ageDaysMax: 135 },
  { category: "FEEDING", content: "Most babies are ready to start solids around 6 months — look for sitting with support, good head control, and interest in food, rather than going by age alone.", ageDaysMin: 150, ageDaysMax: 210 },
  { category: "DEVELOPMENT", content: "Around 6-8 weeks many babies show their first real social smile — a fun milestone to log.", ageDaysMin: 35, ageDaysMax: 70 },
  { category: "DEVELOPMENT", content: "Growth spurts (often around 3 weeks, 6 weeks, and 3 months) can cause a short-lived jump in feeding frequency.", ageDaysMin: 14, ageDaysMax: 100 },
  { category: "SAFETY", content: "Once your baby starts pushing up or rolling, it's time to lower the crib mattress and double-check nothing loose is within reach.", ageDaysMin: 60, ageDaysMax: 180 },
  { category: "DEVELOPMENT", content: "Object permanence starts developing around 8-9 months — peekaboo becomes genuinely delightful, not just cute.", ageDaysMin: 210, ageDaysMax: 300 },
];

/**
 * Ensures up to 2 new due tips exist for the baby's current age, then
 * returns all non-dismissed tips (existing + newly created).
 */
export async function getDueTips(babyId: string) {
  const baby = await prisma.baby.findUniqueOrThrow({ where: { id: babyId } });
  const ageDays = differenceInCalendarDays(new Date(), baby.dob);

  const existing = await prisma.tip.findMany({ where: { babyId } });
  const existingContent = new Set(existing.map((t) => t.content));

  const candidates = TIP_BANK.filter(
    (t) => ageDays >= t.ageDaysMin && ageDays <= t.ageDaysMax && !existingContent.has(t.content),
  );

  const toCreate = candidates.slice(0, 2);
  if (toCreate.length > 0) {
    await prisma.tip.createMany({
      data: toCreate.map((t) => ({
        babyId,
        category: t.category,
        content: t.content,
        ageDaysMin: t.ageDaysMin,
        ageDaysMax: t.ageDaysMax,
        shownAt: new Date(),
      })),
    });
  }

  return prisma.tip.findMany({
    where: { babyId, dismissed: false },
    orderBy: { createdAt: "desc" },
  });
}
