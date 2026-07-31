"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { setCurrentBabyCookie } from "@/lib/current-baby";

const babySchema = z.object({
  name: z.string().min(1, "Name is required"),
  dob: z.string().min(1, "Date of birth is required"),
  sex: z.enum(["MALE", "FEMALE", "UNKNOWN"]),
  notes: z.string().optional(),
});

export async function createBaby(formData: FormData) {
  const parsed = babySchema.parse({
    name: formData.get("name"),
    dob: formData.get("dob"),
    sex: formData.get("sex"),
    notes: formData.get("notes") || undefined,
  });

  const baby = await prisma.baby.create({
    data: { ...parsed, dob: new Date(parsed.dob) },
  });

  await setCurrentBabyCookie(baby.id);
  revalidatePath("/", "layout");
  redirect(`/babies/new?step=caregiver&babyId=${baby.id}`);
}

export async function updateBaby(babyId: string, formData: FormData) {
  const parsed = babySchema.parse({
    name: formData.get("name"),
    dob: formData.get("dob"),
    sex: formData.get("sex"),
    notes: formData.get("notes") || undefined,
  });

  await prisma.baby.update({
    where: { id: babyId },
    data: { ...parsed, dob: new Date(parsed.dob) },
  });

  revalidatePath("/", "layout");
  redirect("/babies");
}

export async function deleteBaby(formData: FormData) {
  const babyId = formData.get("babyId") as string;
  await prisma.baby.delete({ where: { id: babyId } });
  revalidatePath("/", "layout");
  redirect("/babies");
}

export async function selectBaby(formData: FormData) {
  const babyId = formData.get("babyId") as string;
  await setCurrentBabyCookie(babyId);
  revalidatePath("/", "layout");
}
