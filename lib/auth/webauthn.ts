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

/**
 * The origin/RP ID WebAuthn checks against must exactly match what the
 * browser sees, or every ceremony hard-fails. `request.url` can't be
 * trusted for this on Prisma Compute: behind its proxy, Next.js
 * constructs it from the container's internal bind address rather than
 * the public domain — this is what produced the "RP ID '0.0.0.0' is
 * invalid" error. AUTH_ORIGIN, set once as an env var to the real public
 * URL, sidesteps that entirely by not depending on proxied request data.
 * Falls back to the standard forwarded-proxy headers, then request.url,
 * for local dev where AUTH_ORIGIN isn't set (no proxy in the way there).
 */
function resolveOrigin(request: Request): string {
  const configured = process.env.AUTH_ORIGIN;
  if (configured) return configured.replace(/\/$/, "");

  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";
    return `${forwardedProto}://${forwardedHost}`;
  }

  return new URL(request.url).origin;
}

/** Relying Party ID — the bare domain (no scheme/port), matching the origin the browser sees. */
export function getRpId(request: Request): string {
  return new URL(resolveOrigin(request)).hostname;
}

export function getOrigin(request: Request): string {
  return resolveOrigin(request);
}
