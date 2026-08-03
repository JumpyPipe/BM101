import { cache } from "react";
import { prisma } from "@/lib/db";
import { getSessionCaregiverId } from "@/lib/auth/session";

export async function getCurrentCaregiver() {
  const caregiverId = await getSessionCaregiverId();
  if (!caregiverId) return null;
  return prisma.caregiver.findUnique({ where: { id: caregiverId } });
}

/** Whether any caregiver has ever completed the login bootstrap flow. */
export async function anyCaregiverHasLogin(): Promise<boolean> {
  const count = await prisma.caregiver.count({ where: { passwordHash: { not: null } } });
  return count > 0;
}

/**
 * Data Access Layer session check, memoized per-request. Proxy only does an
 * optimistic redirect; every Server Action and Route Handler that mutates or
 * reads private data must call this itself, per the Next.js auth guide's
 * defense-in-depth guidance.
 */
export const verifySession = cache(async () => {
  const caregiverId = await getSessionCaregiverId();
  if (!caregiverId) {
    throw new Error("Unauthorized: you must be signed in to do that.");
  }
  return caregiverId;
});
