import "server-only";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";

export class EmailInUseError extends Error {
  constructor() {
    super("That email is already in use.");
  }
}

/**
 * Open self-serve signup: always creates a brand-new, isolated household
 * with the new caregiver as its OWNER. This is deliberate — per product
 * requirements, nobody ever joins an existing household by signing up
 * (matching name/email, etc.); the only way to join one is an explicit
 * single-use invite link (see lib/actions/invites.ts). Two people who type
 * the same household name here still get two separate households.
 */
export async function createAccountWithNewHousehold(params: {
  name: string;
  email: string;
  password: string;
}): Promise<{ caregiverId: string; householdId: string }> {
  const email = params.email.toLowerCase();

  const existing = await prisma.caregiver.findUnique({ where: { email } });
  if (existing) throw new EmailInUseError();

  const passwordHash = await hashPassword(params.password);

  const household = await prisma.household.create({
    data: {
      name: `${params.name}'s Family`,
      memberships: {
        create: {
          role: "OWNER",
          caregiver: {
            create: {
              name: params.name,
              email,
              passwordHash,
            },
          },
        },
      },
    },
    include: { memberships: true },
  });

  return { caregiverId: household.memberships[0].caregiverId, householdId: household.id };
}

/**
 * Creates a brand-new caregiver + household for someone who signed up via
 * OAuth (Google/Apple) — no password, since Auth.js already verified their
 * identity with the provider. Shares the "always a new household" rule
 * above.
 */
export async function createOAuthAccountWithNewHousehold(params: {
  name: string;
  email: string;
}): Promise<{ caregiverId: string; householdId: string }> {
  const email = params.email.toLowerCase();

  const existing = await prisma.caregiver.findUnique({ where: { email } });
  if (existing) throw new EmailInUseError();

  const household = await prisma.household.create({
    data: {
      name: `${params.name}'s Family`,
      memberships: {
        create: {
          role: "OWNER",
          caregiver: {
            create: {
              name: params.name,
              email,
            },
          },
        },
      },
    },
    include: { memberships: true },
  });

  return { caregiverId: household.memberships[0].caregiverId, householdId: household.id };
}
