"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

const feedingSchema = z.object({
  babyId: z.string().min(1),
  type: z.enum(["BREAST", "BOTTLE", "SOLID"]),
  side: z.enum(["LEFT", "RIGHT", "BOTH"]).optional(),
  amountMl: z.coerce.number().positive().optional(),
  durationMin: z.coerce.number().positive().optional(),
  startedAt: z.string().min(1),
  note: z.string().optional(),
});

export async function createFeedingLog(formData: FormData) {
  const parsed = feedingSchema.parse({
    babyId: formData.get("babyId"),
    type: formData.get("type"),
    side: formData.get("side") || undefined,
    amountMl: formData.get("amountMl") || undefined,
    durationMin: formData.get("durationMin") || undefined,
    startedAt: formData.get("startedAt"),
    note: formData.get("note") || undefined,
  });

  await prisma.feedingLog.create({
    data: { ...parsed, startedAt: new Date(parsed.startedAt) },
  });

  revalidatePath("/feeding");
  revalidatePath("/");
}

export async function deleteFeedingLog(formData: FormData) {
  const id = formData.get("id") as string;
  await prisma.feedingLog.delete({ where: { id } });
  revalidatePath("/feeding");
  revalidatePath("/");
}
