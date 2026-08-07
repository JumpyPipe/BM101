import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/auth/current-caregiver";
import type { HouseholdRole } from "@/app/generated/prisma/client";

const CURRENT_HOUSEHOLD_COOKIE = "bm101_current_household";

export type HouseholdWithRole = {
  id: string;
  name: string;
  role: HouseholdRole;
};

/** Every household a caregiver belongs to, with their role in each. */
export async function getHouseholdsForCaregiver(caregiverId: string): Promise<HouseholdWithRole[]> {
  const memberships = await prisma.householdMembership.findMany({
    where: { caregiverId },
    include: { household: true },
    orderBy: { createdAt: "asc" },
  });
  return memberships.map((m) => ({ id: m.household.id, name: m.household.name, role: m.role }));
}

/**
 * The caregiver's current household — cookie-selected (for caregivers in
 * more than one), falling back to their first membership. Returns null if
 * the caregiver isn't a member of any household at all (shouldn't happen
 * in practice: signup and invite-acceptance both create a membership).
 */
export async function getCurrentHousehold(caregiverId: string): Promise<HouseholdWithRole | null> {
  const households = await getHouseholdsForCaregiver(caregiverId);
  if (households.length === 0) return null;

  const cookieStore = await cookies();
  const selectedId = cookieStore.get(CURRENT_HOUSEHOLD_COOKIE)?.value;
  return households.find((h) => h.id === selectedId) ?? households[0];
}

export async function setCurrentHouseholdCookie(householdId: string) {
  const cookieStore = await cookies();
  cookieStore.set(CURRENT_HOUSEHOLD_COOKIE, householdId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

/**
 * Whether the caregiver is a member of the household that owns this baby.
 * Deliberately doesn't distinguish "no such baby" from "not yours" — same
 * false either way, so a caller can't probe for the existence of babies in
 * other households.
 */
export async function isHouseholdBaby(caregiverId: string, babyId: string): Promise<boolean> {
  const membership = await prisma.householdMembership.findFirst({
    where: { caregiverId, household: { babies: { some: { id: babyId } } } },
    select: { id: true },
  });
  return membership !== null;
}

/** Throwing variant of isHouseholdBaby, for Server Actions where a generic error is fine to bubble up. */
export async function requireHouseholdBaby(caregiverId: string, babyId: string): Promise<void> {
  if (!(await isHouseholdBaby(caregiverId, babyId))) {
    throw new Error("Not found.");
  }
}

/** Whether a caregiver belongs to a specific household. */
export async function isHouseholdMember(householdId: string, caregiverId: string): Promise<boolean> {
  const membership = await prisma.householdMembership.findUnique({
    where: { householdId_caregiverId: { householdId, caregiverId } },
    select: { id: true },
  });
  return membership !== null;
}

/**
 * Convenience for pages/actions that need both: the signed-in caregiver
 * and their current household, in one call. Memoized per-request like
 * verifySession(), so calling it from several places in the same render
 * doesn't mean several database round-trips.
 */
export const requireCurrentHousehold = cache(async (): Promise<{
  caregiverId: string;
  household: HouseholdWithRole;
}> => {
  const caregiverId = await verifySession();
  const household = await getCurrentHousehold(caregiverId);
  if (!household) {
    throw new Error("You're not part of a household yet.");
  }
  return { caregiverId, household };
});

/**
 * Unclaimed caregivers (passwordHash null) eligible for the /setup
 * bootstrap page — only those belonging to a household where *nobody* has
 * claimed a login yet. Once a household has even one claimed member, its
 * remaining unclaimed caregivers must be claimed by that member instead
 * (via setCaregiverLogin), not through /setup — same security property as
 * before households existed, just scoped per-household now instead of
 * globally. Without this scoping, one unrelated household's owner signing
 * up would incorrectly lock /setup for every other household's remaining
 * unclaimed caregivers.
 */
export async function getUnclaimedCaregiversNeedingBootstrap() {
  const unclaimed = await prisma.caregiver.findMany({
    where: { passwordHash: null },
    include: { memberships: { select: { householdId: true } } },
    orderBy: { createdAt: "asc" },
  });
  if (unclaimed.length === 0) return [];

  const householdIds = [...new Set(unclaimed.flatMap((c) => c.memberships.map((m) => m.householdId)))];
  const claimedMemberships = await prisma.householdMembership.findMany({
    where: { householdId: { in: householdIds }, caregiver: { passwordHash: { not: null } } },
    select: { householdId: true },
  });
  const claimedHouseholdIds = new Set(claimedMemberships.map((m) => m.householdId));

  return unclaimed.filter((c) => c.memberships.some((m) => !claimedHouseholdIds.has(m.householdId)));
}

/** Whether this specific caregiver is still eligible for /setup self-claim (see above). */
export async function isEligibleForBootstrapClaim(caregiverId: string): Promise<boolean> {
  const eligible = await getUnclaimedCaregiversNeedingBootstrap();
  return eligible.some((c) => c.id === caregiverId);
}

/** Throws unless the caregiver is an OWNER of this household (invite management, etc.). */
export async function requireHouseholdOwner(caregiverId: string, householdId: string): Promise<void> {
  const membership = await prisma.householdMembership.findUnique({
    where: { householdId_caregiverId: { householdId, caregiverId } },
    select: { role: true },
  });
  if (!membership || membership.role !== "OWNER") {
    throw new Error("Only a household owner can do that.");
  }
}
