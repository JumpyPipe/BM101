"use server";

import { revalidatePath } from "next/cache";
import { verifySession } from "@/lib/auth/current-caregiver";
import { isHouseholdMember, setCurrentHouseholdCookie } from "@/lib/household";

/** Switches which of the caregiver's households is "current" — must already be a member. */
export async function switchHousehold(formData: FormData) {
  const caregiverId = await verifySession();
  const householdId = formData.get("householdId");
  if (typeof householdId !== "string" || !householdId) return;
  if (!(await isHouseholdMember(householdId, caregiverId))) return;

  await setCurrentHouseholdCookie(householdId);
  revalidatePath("/");
}
