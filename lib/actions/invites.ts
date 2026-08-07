"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/auth/current-caregiver";
import {
  requireCurrentHousehold,
  requireHouseholdOwner,
  isHouseholdMember,
  setCurrentHouseholdCookie,
} from "@/lib/household";

export type ActionState = { error: string } | null;

const INVITE_TTL_DAYS = 7;

/**
 * The only way anyone joins an existing household: an owner mints a
 * single-use, expiring token here; nobody joins by matching name/email
 * during signup (see lib/auth/signup.ts).
 */
export async function createInvite(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const { caregiverId, household } = await requireCurrentHousehold();
  try {
    await requireHouseholdOwner(caregiverId, household.id);
  } catch {
    return { error: "Only a household owner can create invite links." };
  }

  const role = formData.get("role") === "OWNER" ? "OWNER" : "MEMBER";
  const token = crypto.randomBytes(32).toString("base64url");

  await prisma.householdInvite.create({
    data: {
      householdId: household.id,
      token,
      role,
      createdById: caregiverId,
      expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });

  revalidatePath("/babies/invite");
  return null;
}

export async function revokeInvite(id: string) {
  const { caregiverId, household } = await requireCurrentHousehold();
  await requireHouseholdOwner(caregiverId, household.id);

  // Scoped to the caller's household — deleteMany rather than delete so a
  // mismatched id (not this household's invite) is a silent no-op, not an
  // error that leaks whether that id exists elsewhere.
  await prisma.householdInvite.deleteMany({
    where: { id, householdId: household.id },
  });

  revalidatePath("/babies/invite");
}

/**
 * Accept an invite — requires being signed in (the /invite/[token] page
 * sends signed-out visitors to sign up/in first, with `next` pointing back
 * here). Re-validates the token server-side regardless of what the page
 * showed, since it may have gone stale between page load and submit.
 */
export async function acceptInvite(token: string) {
  const caregiverId = await verifySession();

  const invite = await prisma.householdInvite.findUnique({ where: { token } });
  const valid = invite && !invite.usedAt && !(invite.expiresAt && invite.expiresAt < new Date());

  if (!valid || !invite) {
    redirect(`/invite/${token}`);
  }

  const alreadyMember = await isHouseholdMember(invite.householdId, caregiverId);
  if (!alreadyMember) {
    await prisma.$transaction([
      prisma.householdMembership.create({
        data: { householdId: invite.householdId, caregiverId, role: invite.role },
      }),
      prisma.householdInvite.update({
        where: { id: invite.id },
        data: { usedAt: new Date(), usedById: caregiverId },
      }),
    ]);
  }

  await setCurrentHouseholdCookie(invite.householdId);
  redirect("/");
}
