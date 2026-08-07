import "server-only";
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import type { Provider } from "next-auth/providers";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import { setCurrentHouseholdCookie } from "@/lib/household";
import { createOAuthAccountWithNewHousehold } from "@/lib/auth/signup";

// Only register a provider once its credentials are actually configured —
// lets the app run locally / in preview without either OAuth app set up,
// instead of NextAuth throwing on missing client id/secret at startup.
const providers: Provider[] = [];
if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(Google);
}
if (process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET) {
  providers.push(Apple);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  // Same class of problem as the WebAuthn RP-ID bug: behind Prisma
  // Compute's proxy, request.url reflects the container's internal bind
  // address, not the public domain. trustHost tells Auth.js to derive its
  // base URL from AUTH_URL (authoritative, set in production) or the
  // standard x-forwarded-* headers, rather than the raw request.
  trustHost: true,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    /**
     * Auth.js only handles the OAuth handshake here. Once it hands us a
     * verified profile, we resolve it to our own Caregiver/Household and
     * start our own session cookie directly — the app's actual auth
     * boundary is `snug_session` (see lib/auth/session.ts), never Auth.js's
     * own session. This keeps a single source of truth for "who's signed
     * in" across password, Face ID, and OAuth.
     *
     * Signing up via Google/Apple always creates a brand-new, isolated
     * household (never auto-joins an existing one by email match) — same
     * rule as password signup. The only way to join an existing household
     * is an explicit invite link.
     */
    async signIn({ user, profile }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;

      // Google can report an unverified email (false); Apple's is always
      // verified. Refuse to sign in or link an account on an unverified
      // email — it isn't a trustworthy identity to match against.
      if (profile?.email_verified === false) return false;

      const name = user.name?.trim() || email.split("@")[0];

      const existing = await prisma.caregiver.findUnique({
        where: { email },
        include: { memberships: { orderBy: { createdAt: "asc" }, take: 1 } },
      });

      let caregiverId: string;
      let householdId: string;

      if (existing) {
        if (existing.memberships.length === 0) {
          // Shouldn't happen — every caregiver gets a membership at
          // creation — but fail closed rather than sign in to nowhere.
          return false;
        }
        caregiverId = existing.id;
        householdId = existing.memberships[0].householdId;
      } else {
        const created = await createOAuthAccountWithNewHousehold({ name, email });
        caregiverId = created.caregiverId;
        householdId = created.householdId;
      }

      await createSession(caregiverId);
      await setCurrentHouseholdCookie(householdId);
      return true;
    },
  },
});
