"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/auth/current-caregiver";

const caregiverSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
});

export async function createCaregiver(formData: FormData) {
  await verifySession();
  const parsed = caregiverSchema.parse({
    name: formData.get("name"),
    role: formData.get("role"),
  });
  await prisma.caregiver.create({ data: parsed });
  revalidatePath("/babies");
  redirect("/babies");
}

/** Used only by the "add a baby" guided flow's optional caregiver step. */
export async function createCaregiverOnboarding(formData: FormData) {
  await verifySession();
  const parsed = caregiverSchema.parse({
    name: formData.get("name"),
    role: formData.get("role"),
  });
  await prisma.caregiver.create({ data: parsed });
  revalidatePath("/babies");
  redirect("/");
}

export async function updateCaregiver(caregiverId: string, formData: FormData) {
  await verifySession();
  const parsed = caregiverSchema.parse({
    name: formData.get("name"),
    role: formData.get("role"),
  });
  await prisma.caregiver.update({ where: { id: caregiverId }, data: parsed });
  revalidatePath("/babies");
  redirect("/babies");
}

export async function deleteCaregiver(formData: FormData) {
  await verifySession();
  const caregiverId = formData.get("caregiverId") as string;
  await prisma.caregiver.delete({ where: { id: caregiverId } });
  revalidatePath("/babies");
}
