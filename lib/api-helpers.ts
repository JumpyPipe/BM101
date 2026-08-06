import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiAuthError } from "@/lib/auth/api-auth";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Runs a handler body, turning ZodErrors into a 422 and ApiAuthErrors into a 401 JSON response. */
export async function handleRoute(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn();
  } catch (e) {
    if (e instanceof ApiAuthError) {
      return jsonError(e.message, 401);
    }
    if (e instanceof ZodError) {
      return jsonError(e.issues.map((i) => i.message).join("; "), 422);
    }
    if (e instanceof Error) {
      console.error("API v1 error:", e);
      return jsonError(e.message, 500);
    }
    throw e;
  }
}
