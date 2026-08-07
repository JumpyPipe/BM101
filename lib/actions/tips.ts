"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireCurrentHousehold, requireHouseholdBaby } from "@/lib/household";

export async function dismissTip(formData: FormData) {
  const { caregiverId } = await requireCurrentHousehold();
  const id = formData.get("id") as string;
  const tip = await prisma.tip.findUnique({ where: { id }, select: { babyId: true } });
  if (!tip) return;
  await requireHouseholdBaby(caregiverId, tip.babyId);
  await prisma.tip.update({ where: { id }, data: { dismissed: true } });
  revalidatePath("/");
}

export async function rateTip(formData: FormData) {
  const { caregiverId } = await requireCurrentHousehold();
  const id = formData.get("id") as string;
  const useful = formData.get("useful") === "true";
  const tip = await prisma.tip.findUnique({ where: { id }, select: { babyId: true } });
  if (!tip) return;
  await requireHouseholdBaby(caregiverId, tip.babyId);
  await prisma.tip.update({ where: { id }, data: { usefulFeedback: useful } });
  revalidatePath("/");
}
