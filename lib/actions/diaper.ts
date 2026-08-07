"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCurrentHousehold, requireHouseholdBaby } from "@/lib/household";

const diaperSchema = z.object({
  babyId: z.string().min(1),
  type: z.enum(["WET", "DIRTY", "MIXED"]),
  occurredAt: z.string().min(1),
  note: z.string().optional(),
});

export async function createDiaperLog(formData: FormData) {
  const { caregiverId } = await requireCurrentHousehold();
  const parsed = diaperSchema.parse({
    babyId: formData.get("babyId"),
    type: formData.get("type"),
    occurredAt: formData.get("occurredAt"),
    note: formData.get("note") || undefined,
  });
  await requireHouseholdBaby(caregiverId, parsed.babyId);

  await prisma.diaperLog.create({
    data: { ...parsed, occurredAt: new Date(parsed.occurredAt) },
  });

  revalidatePath("/diaper");
  revalidatePath("/");
}

/** One-tap logging used by the dashboard quick actions — defaults to "now". */
export async function quickLogDiaper(formData: FormData) {
  const { caregiverId } = await requireCurrentHousehold();
  const babyId = formData.get("babyId") as string;
  const type = formData.get("type") as "WET" | "DIRTY" | "MIXED";
  await requireHouseholdBaby(caregiverId, babyId);
  await prisma.diaperLog.create({
    data: { babyId, type, occurredAt: new Date() },
  });
  revalidatePath("/diaper");
  revalidatePath("/");
}

export async function deleteDiaperLog(formData: FormData) {
  const { caregiverId } = await requireCurrentHousehold();
  const id = formData.get("id") as string;
  const log = await prisma.diaperLog.findUnique({ where: { id }, select: { babyId: true } });
  if (!log) return;
  await requireHouseholdBaby(caregiverId, log.babyId);
  await prisma.diaperLog.delete({ where: { id } });
  revalidatePath("/diaper");
  revalidatePath("/");
}
