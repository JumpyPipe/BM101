import "server-only";
import { verifySessionToken, getSessionCaregiverId } from "@/lib/auth/session";
import { getCurrentHousehold } from "@/lib/household";

/** Thrown by `requireApiCaregiver` — caught by `handleRoute` and mapped to a 401. */
export class ApiAuthError extends Error {}

/**
 * Auth for `/api/v1/*` — accepts either credential:
 *
 * - `Authorization: Bearer <token>`, obtained from `POST /api/v1/auth/login`
 *   and stored in the device Keychain — how the native iOS client (which
 *   can't rely on cookies the same way a browser does) authenticates.
 * - The web app's own httpOnly session cookie (see `lib/auth/session.ts`)
 *   — some `/api/v1` routes (e.g. `/api/v1/parse`, see
 *   `components/dashboard/quick-note.tsx`) are called directly by the web
 *   app's own browser-side `fetch()`, which sends cookies, not a bearer
 *   token, since the endpoint is intentionally shared between both clients.
 *
 * `proxy.ts` deliberately leaves `/api/v1/*` out of its cookie-session
 * check (the same "optimistic check in Proxy, real enforcement close to
 * the data" split used for the web app's Server Actions) — this is the
 * real enforcement for the iOS API surface.
 */
export async function requireApiCaregiver(req: Request): Promise<string> {
  const header = req.headers.get("authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;
  const bearerCaregiverId = token ? await verifySessionToken(token) : null;
  if (bearerCaregiverId) return bearerCaregiverId;

  const cookieCaregiverId = await getSessionCaregiverId();
  if (cookieCaregiverId) return cookieCaregiverId;

  throw new ApiAuthError("Unauthorized — include a valid Bearer token from /api/v1/auth/login.");
}

/**
 * Same as requireApiCaregiver, plus resolves the caregiver's household —
 * every /api/v1 route that touches babies/logs needs this, now that
 * households scope who can see what. Falls back to the caregiver's first
 * household membership (the iOS client doesn't send a household-selector
 * cookie the way the web app's UI does — fine in practice, since the
 * common case is one household per caregiver).
 */
export async function requireApiHousehold(
  req: Request,
): Promise<{ caregiverId: string; householdId: string }> {
  const caregiverId = await requireApiCaregiver(req);
  const household = await getCurrentHousehold(caregiverId);
  if (!household) {
    throw new ApiAuthError("You're not part of a household yet.");
  }
  return { caregiverId, householdId: household.id };
}
