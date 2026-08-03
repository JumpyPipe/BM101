"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/auth/current-caregiver";

const sleepSchema = z.object({
  babyId: z.string().min(1),
  type: z.enum(["NAP", "NIGHT"]),
  startedAt: z.string().min(1),
  endedAt: z.string().optional(),
  note: z.string().optional(),
});

export async function createSleepLog(formData: FormData) {
  await verifySession();
  const parsed = sleepSchema.parse({
    babyId: formData.get("babyId"),
    type: formData.get("type"),
    startedAt: formData.get("startedAt"),
    endedAt: formData.get("endedAt") || undefined,
    note: formData.get("note") || undefined,
  });

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
  await verifySession();
  const id = formData.get("id") as string;
  await prisma.sleepLog.update({ where: { id }, data: { endedAt: new Date() } });
  revalidatePath("/sleep");
  revalidatePath("/");
}

export async function deleteSleepLog(formData: FormData) {
  await verifySession();
  const id = formData.get("id") as string;
  await prisma.sleepLog.delete({ where: { id } });
  revalidatePath("/sleep");
  revalidatePath("/");
}
