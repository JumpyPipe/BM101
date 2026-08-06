import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleRoute, jsonError } from "@/lib/api-helpers";
import { verifyPassword } from "@/lib/auth/password";
import { signSessionToken } from "@/lib/auth/session";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * Native-client login: same credentials a caregiver set up via the web
 * app's /setup or /caregivers/[id]/edit ("Login & security"), but returns
 * a bearer token instead of setting a cookie — see lib/auth/api-auth.ts.
 * Token is a 30-day signed JWT, same as the web session token; the iOS app
 * is expected to store it in the Keychain.
 */
export async function POST(req: Request) {
  return handleRoute(async () => {
    const parsed = loginSchema.safeParse(await req.json());
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Invalid input", 422);
    }

    const caregiver = await prisma.caregiver.findUnique({
      where: { email: parsed.data.email.toLowerCase() },
    });

    // Same generic message whether the email doesn't exist or the password
    // is wrong — don't let login responses reveal which emails are registered.
    if (!caregiver || !caregiver.passwordHash) {
      return jsonError("Incorrect email or password.", 401);
    }
    const valid = await verifyPassword(parsed.data.password, caregiver.passwordHash);
    if (!valid) {
      return jsonError("Incorrect email or password.", 401);
    }

    const token = await signSessionToken(caregiver.id);
    return NextResponse.json({
      token,
      caregiver: {
        id: caregiver.id,
        name: caregiver.name,
        role: caregiver.role,
        email: caregiver.email,
      },
    });
  });
}
