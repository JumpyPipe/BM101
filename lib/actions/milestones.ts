"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

const milestoneSchema = z.object({
  babyId: z.string().min(1),
  occurredAt: z.string().min(1),
  category: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
});

export async function createMilestone(formData: FormData) {
  const parsed = milestoneSchema.parse({
    babyId: formData.get("babyId"),
    occurredAt: formData.get("occurredAt"),
    category: formData.get("category"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
  });

  await prisma.milestone.create({
    data: { ...parsed, occurredAt: new Date(parsed.occurredAt) },
  });

  revalidatePath("/milestones");
  revalidatePath("/");
}

export async function deleteMilestone(formData: FormData) {
  const id = formData.get("id") as string;
  await prisma.milestone.delete({ where: { id } });
  revalidatePath("/milestones");
  revalidatePath("/");
}
