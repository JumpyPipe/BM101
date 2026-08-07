"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCurrentHousehold, requireHouseholdBaby } from "@/lib/household";

const sleepSchema = z.object({
  babyId: z.string().min(1),
  type: z.enum(["NAP", "NIGHT"]),
  startedAt: z.string().min(1),
  endedAt: z.string().optional(),
  note: z.string().optional(),
});

export async function createSleepLog(formData: FormData) {
  const { caregiverId } = await requireCurrentHousehold();
  const parsed = sleepSchema.parse({
    babyId: formData.get("babyId"),
    type: formData.get("type"),
    startedAt: formData.get("startedAt"),
    endedAt: formData.get("endedAt") || undefined,
    note: formData.get("note") || undefined,
  });
  await requireHouseholdBaby(caregiverId, parsed.babyId);

  await prisma.sleepLog.create({
    data: {
      ...parsed,
      startedAt: new Date(parsed.startedAt),
      endedAt: parsed.endedAt ? new Date(parsed.endedAt) : null,
    },
  });

  revalidatePath("/sleep");
  revalidatePath("/");
}

export async function endSleepLog(formData: FormData) {
  const { caregiverId } = await requireCurrentHousehold();
  const id = formData.get("id") as string;
  const log = await prisma.sleepLog.findUnique({ where: { id }, select: { babyId: true } });
  if (!log) return;
  await requireHouseholdBaby(caregiverId, log.babyId);
  await prisma.sleepLog.update({ where: { id }, data: { endedAt: new Date() } });
  revalidatePath("/sleep");
  revalidatePath("/");
}

export async function deleteSleepLog(formData: FormData) {
  const { caregiverId } = await requireCurrentHousehold();
  const id = formData.get("id") as string;
  const log = await prisma.sleepLog.findUnique({ where: { id }, select: { babyId: true } });
  if (!log) return;
  await requireHouseholdBaby(caregiverId, log.babyId);
  await prisma.sleepLog.delete({ where: { id } });
  revalidatePath("/sleep");
  revalidatePath("/");
}
