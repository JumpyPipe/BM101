import { signInWithGoogle, signInWithApple } from "@/lib/actions/oauth";

/**
 * Server Component (form actions work without "use client") — reads the
 * env vars directly so each button only renders once that provider is
 * actually configured, matching auth.ts's own provider gating. Wraps
 * `children` (the password form) so the "or" divider only appears when at
 * least one provider is actually enabled.
 */
export function OAuthButtons({ children }: { children?: React.ReactNode }) {
  const googleEnabled = !!(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  const appleEnabled = !!(process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET);

  if (!googleEnabled && !appleEnabled) return <>{children}</>;

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex w-full flex-col gap-2">
        {googleEnabled && (
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
            >
              <GoogleLogo />
              Continue with Google
            </button>
          </form>
        )}
        {appleEnabled && (
          <form action={signInWithApple}>
            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-black text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              <AppleLogo />
              Continue with Apple
            </button>
          </form>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-zinc-400">
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        or
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>
      {children}
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.88 2.69-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.81.54-1.85.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.95v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.96 10.71a5.4 5.4 0 0 1 0-3.42V4.96H.95a9 9 0 0 0 0 8.08l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .95 4.96l3.01 2.33C4.67 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

function AppleLogo() {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" fill="currentColor" aria-hidden="true">
      <path d="M13.14 9.55c-.02-2 1.64-2.96 1.71-3.01-.94-1.37-2.4-1.56-2.92-1.58-1.24-.13-2.43.73-3.06.73-.63 0-1.6-.71-2.63-.69-1.35.02-2.6.79-3.29 2-1.41 2.43-.36 6.03 1 8 .67.96 1.46 2.04 2.5 2 1-.04 1.38-.65 2.6-.65 1.21 0 1.55.65 2.61.62 1.08-.02 1.76-.98 2.42-1.94.76-1.11 1.08-2.19 1.1-2.24-.02-.01-2.1-.81-2.04-3.24Z" />
      <path d="M11.2 3.4c.55-.67.92-1.6.82-2.53-.79.03-1.75.53-2.32 1.19-.51.59-.96 1.54-.84 2.44.88.07 1.79-.44 2.34-1.1Z" />
    </svg>
  );
}
