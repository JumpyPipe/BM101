import "server-only";
import { headers } from "next/headers";

/**
 * Absolute base URL for building links (invite URLs, etc.) from a Server
 * Action or Server Component, where there's no Request object to read.
 * Same reverse-proxy problem as lib/auth/webauthn.ts's resolveOrigin —
 * behind Prisma Compute's proxy, the request Next.js sees doesn't reflect
 * the public domain — so it prefers the same authoritative AUTH_ORIGIN env
 * var, falling back to forwarded-proxy headers, then the raw Host header
 * for local dev.
 */
export async function getSiteUrl(): Promise<string> {
  const configured = process.env.AUTH_ORIGIN;
  if (configured) return configured.replace(/\/$/, "");

  const h = await headers();
  const forwardedHost = h.get("x-forwarded-host");
  if (forwardedHost) {
    const forwardedProto = h.get("x-forwarded-proto") ?? "https";
    return `${forwardedProto}://${forwardedHost}`;
  }

  const host = h.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  return `${proto}://${host}`;
}
