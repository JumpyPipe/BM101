"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, clearSession, getSessionCaregiverId } from "@/lib/auth/session";
import { isEligibleForBootstrapClaim, isHouseholdMember, getCurrentHousehold, setCurrentHouseholdCookie } from "@/lib/household";
import { createAccountWithNewHousehold, EmailInUseError } from "@/lib/auth/signup";

export type ActionState = { error: string } | null;

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  next: z.string().optional(),
});

export async function login(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const caregiver = await prisma.caregiver.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  // Same generic message whether the email doesn't exist or the password is
  // wrong — don't let login responses reveal which emails are registered.
  if (!caregiver || !caregiver.passwordHash) {
    return { error: "Incorrect email or password." };
  }

  const valid = await verifyPassword(parsed.data.password, caregiver.passwordHash);
  if (!valid) {
    return { error: "Incorrect email or password." };
  }

  await createSession(caregiver.id);
  const next = parsed.data.next;
  redirect(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

export async function logout() {
  await clearSession();
  redirect("/login");
}

const signUpSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  next: z.string().optional(),
});

/**
 * Open self-serve signup — always creates a brand-new, isolated household
 * with this caregiver as its owner (see lib/auth/signup.ts). Joining an
 * existing household only ever happens via an explicit invite link. `next`
 * (e.g. /invite/<token>) lets someone who followed an invite link while
 * signed out land back on it to actually accept it, instead of being
 * dropped on their own new household's dashboard.
 */
export async function signUp(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  let result;
  try {
    result = await createAccountWithNewHousehold(parsed.data);
  } catch (e) {
    if (e instanceof EmailInUseError) {
      return { error: "That email is already in use. Try signing in instead." };
    }
    throw e;
  }

  await createSession(result.caregiverId);
  await setCurrentHouseholdCookie(result.householdId);
  const next = parsed.data.next;
  redirect(next && next.startsWith("/") && !next.startsWith("//") ? next : "/");
}

const claimSchema = z.object({
  caregiverId: z.string().min(1),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * One-time bootstrap: claim login for an existing, credential-less
 * caregiver left over from before per-caregiver login existed (e.g. the
 * account this app originally migrated from a single shared login). Only
 * caregivers whose household has no claimed member yet are eligible — once
 * a household has one, its remaining unclaimed caregivers must be claimed
 * by that member instead (via setCaregiverLogin).
 */
export async function claimAccount(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = claimSchema.safeParse({
    caregiverId: formData.get("caregiverId"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  if (!(await isEligibleForBootstrapClaim(parsed.data.caregiverId))) {
    return { error: "That caregiver isn't available to claim. Sign in instead, or ask an owner to invite you." };
  }

  const caregiver = await prisma.caregiver.findUnique({ where: { id: parsed.data.caregiverId } });
  if (!caregiver || caregiver.passwordHash) {
    return { error: "That caregiver isn't available to claim." };
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await prisma.caregiver.update({
    where: { id: caregiver.id },
    data: { email: parsed.data.email.toLowerCase(), passwordHash },
  });

  await createSession(caregiver.id);
  redirect("/");
}

const setLoginSchema = z.object({
  caregiverId: z.string().min(1),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal("")),
});

/** Set or reset another (or your own) caregiver's login — requires an existing session. */
export async function setCaregiverLogin(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const sessionCaregiverId = await getSessionCaregiverId();
  if (!sessionCaregiverId) {
    return { error: "You must be signed in to do that." };
  }

  const parsed = setLoginSchema.safeParse({
    caregiverId: formData.get("caregiverId"),
    email: formData.get("email"),
    password: formData.get("password") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const household = await getCurrentHousehold(sessionCaregiverId);
  if (!household || !(await isHouseholdMember(household.id, parsed.data.caregiverId))) {
    return { error: "That caregiver isn't in your household." };
  }

  const data: { email: string; passwordHash?: string } = {
    email: parsed.data.email.toLowerCase(),
  };
  if (parsed.data.password) {
    data.passwordHash = await hashPassword(parsed.data.password);
  }

  try {
    await prisma.caregiver.update({ where: { id: parsed.data.caregiverId }, data });
  } catch {
    return { error: "That email is already in use by another caregiver." };
  }

  revalidatePath("/babies");
  return null;
}
