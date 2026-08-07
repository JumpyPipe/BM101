"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCurrentHousehold, requireHouseholdBaby } from "@/lib/household";

const growthSchema = z.object({
  babyId: z.string().min(1),
  measuredAt: z.string().min(1),
  weightKg: z.coerce.number().positive().optional(),
  heightCm: z.coerce.number().positive().optional(),
  headCm: z.coerce.number().positive().optional(),
  note: z.string().optional(),
});

export async function createGrowthLog(formData: FormData) {
  const { caregiverId } = await requireCurrentHousehold();
  const parsed = growthSchema.parse({
    babyId: formData.get("babyId"),
    measuredAt: formData.get("measuredAt"),
    weightKg: formData.get("weightKg") || undefined,
    heightCm: formData.get("heightCm") || undefined,
    headCm: formData.get("headCm") || undefined,
    note: formData.get("note") || undefined,
  });
  await requireHouseholdBaby(caregiverId, parsed.babyId);

  await prisma.growthLog.create({
    data: { ...parsed, measuredAt: new Date(parsed.measuredAt) },
  });

  revalidatePath("/growth");
  revalidatePath("/");
}

export async function deleteGrowthLog(formData: FormData) {
  const { caregiverId } = await requireCurrentHousehold();
  const id = formData.get("id") as string;
  const log = await prisma.growthLog.findUnique({ where: { id }, select: { babyId: true } });
  if (!log) return;
  await requireHouseholdBaby(caregiverId, log.babyId);
  await prisma.growthLog.delete({ where: { id } });
  revalidatePath("/growth");
  revalidatePath("/");
}
