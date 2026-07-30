"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

export async function dismissTip(formData: FormData) {
  const id = formData.get("id") as string;
  await prisma.tip.update({ where: { id }, data: { dismissed: true } });
  revalidatePath("/");
}

export async function rateTip(formData: FormData) {
  const id = formData.get("id") as string;
  const useful = formData.get("useful") === "true";
  await prisma.tip.update({ where: { id }, data: { usefulFeedback: useful } });
  revalidatePath("/");
}
