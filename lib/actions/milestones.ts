"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCurrentHousehold, requireHouseholdBaby } from "@/lib/household";

const milestoneSchema = z.object({
  babyId: z.string().min(1),
  occurredAt: z.string().min(1),
  category: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
});

export async function createMilestone(formData: FormData) {
  const { caregiverId } = await requireCurrentHousehold();
  const parsed = milestoneSchema.parse({
    babyId: formData.get("babyId"),
    occurredAt: formData.get("occurredAt"),
    category: formData.get("category"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
  });
  await requireHouseholdBaby(caregiverId, parsed.babyId);

  await prisma.milestone.create({
    data: { ...parsed, occurredAt: new Date(parsed.occurredAt) },
  });

  revalidatePath("/milestones");
  revalidatePath("/");
}

export async function deleteMilestone(formData: FormData) {
  const { caregiverId } = await requireCurrentHousehold();
  const id = formData.get("id") as string;
  const milestone = await prisma.milestone.findUnique({ where: { id }, select: { babyId: true } });
  if (!milestone) return;
  await requireHouseholdBaby(caregiverId, milestone.babyId);
  await prisma.milestone.delete({ where: { id } });
  revalidatePath("/milestones");
  revalidatePath("/");
}
