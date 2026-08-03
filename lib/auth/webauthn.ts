import "server-only";
import { cookies } from "next/headers";

const CHALLENGE_COOKIE_NAME = "snug_webauthn_challenge";

export async function setChallenge(challenge: string) {
  const cookieStore = await cookies();
  cookieStore.set(CHALLENGE_COOKIE_NAME, challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 5,
  });
}

export async function getAndClearChallenge(): Promise<string | null> {
  const cookieStore = await cookies();
  const challenge = cookieStore.get(CHALLENGE_COOKIE_NAME)?.value ?? null;
  cookieStore.delete(CHALLENGE_COOKIE_NAME);
  return challenge;
}

/** Relying Party ID — must be the bare domain (no scheme/port), matching the origin the browser sees. */
export function getRpId(request: Request): string {
  return new URL(request.url).hostname;
}

export function getOrigin(request: Request): string {
  return new URL(request.url).origin;
}
