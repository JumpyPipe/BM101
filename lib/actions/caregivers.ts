"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireCurrentHousehold, isHouseholdMember } from "@/lib/household";

const caregiverSchema = z.object({
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
});

/** Throws unless the target caregiver is a member of the given household. */
async function requireHouseholdMember(householdId: string, caregiverId: string) {
  if (!(await isHouseholdMember(householdId, caregiverId))) throw new Error("Not found.");
}

export async function createCaregiver(formData: FormData) {
  const { household } = await requireCurrentHousehold();
  const parsed = caregiverSchema.parse({
    name: formData.get("name"),
    role: formData.get("role"),
  });
  await prisma.caregiver.create({
    data: { ...parsed, memberships: { create: { householdId: household.id, role: "MEMBER" } } },
  });
  revalidatePath("/babies");
  redirect("/babies");
}

/** Used only by the "add a baby" guided flow's optional caregiver step. */
export async function createCaregiverOnboarding(formData: FormData) {
  const { household } = await requireCurrentHousehold();
  const parsed = caregiverSchema.parse({
    name: formData.get("name"),
    role: formData.get("role"),
  });
  await prisma.caregiver.create({
    data: { ...parsed, memberships: { create: { householdId: household.id, role: "MEMBER" } } },
  });
  revalidatePath("/babies");
  redirect("/");
}

export async function updateCaregiver(caregiverId: string, formData: FormData) {
  const { household } = await requireCurrentHousehold();
  await requireHouseholdMember(household.id, caregiverId);
  const parsed = caregiverSchema.parse({
    name: formData.get("name"),
    role: formData.get("role"),
  });
  await prisma.caregiver.update({ where: { id: caregiverId }, data: parsed });
  revalidatePath("/babies");
  redirect("/babies");
}

/**
 * Removes a caregiver from the current household — not a global account
 * deletion. A caregiver can belong to more than one household, so this
 * only deletes their HouseholdMembership row here; their account (and any
 * other household they're part of) is untouched.
 */
export async function deleteCaregiver(formData: FormData) {
  const { household } = await requireCurrentHousehold();
  const caregiverId = formData.get("caregiverId") as string;
  await requireHouseholdMember(household.id, caregiverId);
  await prisma.householdMembership.delete({
    where: { householdId_caregiverId: { householdId: household.id, caregiverId } },
  });
  revalidatePath("/babies");
}
