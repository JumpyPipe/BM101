"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

const diaperSchema = z.object({
  babyId: z.string().min(1),
  type: z.enum(["WET", "DIRTY", "MIXED"]),
  occurredAt: z.string().min(1),
  note: z.string().optional(),
});

export async function createDiaperLog(formData: FormData) {
  const parsed = diaperSchema.parse({
    babyId: formData.get("babyId"),
    type: formData.get("type"),
    occurredAt: formData.get("occurredAt"),
    note: formData.get("note") || undefined,
  });

  await prisma.diaperLog.create({
    data: { ...parsed, occurredAt: new Date(parsed.occurredAt) },
  });

  revalidatePath("/diaper");
  revalidatePath("/");
}

/** One-tap logging used by the dashboard quick actions — defaults to "now". */
export async function quickLogDiaper(formData: FormData) {
  const babyId = formData.get("babyId") as string;
  const type = formData.get("type") as "WET" | "DIRTY" | "MIXED";
  await prisma.diaperLog.create({
    data: { babyId, type, occurredAt: new Date() },
  });
  revalidatePath("/diaper");
  revalidatePath("/");
}

export async function deleteDiaperLog(formData: FormData) {
  const id = formData.get("id") as string;
  await prisma.diaperLog.delete({ where: { id } });
  revalidatePath("/diaper");
  revalidatePath("/");
}
