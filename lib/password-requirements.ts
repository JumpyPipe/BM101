/**
 * Single source of truth for password policy — shared between the live
 * checklist UI (components/auth/password-requirements.tsx) and the
 * server-side Zod validation (lib/actions/auth.ts's signUpSchema), so the
 * two can never drift: whatever the client shows as "met" is exactly what
 * the server will accept. Deliberately isomorphic (no server-only/client
 * component APIs) so it can be imported from both a Server Action file and
 * a "use client" component.
 */
export type PasswordRequirement = {
  id: string;
  label: string;
  test: (password: string) => boolean;
};

export const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { id: "length", label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { id: "uppercase", label: "One uppercase letter", test: (pw) => /[A-Z]/.test(pw) },
  { id: "lowercase", label: "One lowercase letter", test: (pw) => /[a-z]/.test(pw) },
  { id: "number", label: "One number", test: (pw) => /[0-9]/.test(pw) },
];

export function meetsPasswordRequirements(password: string): boolean {
  return PASSWORD_REQUIREMENTS.every((r) => r.test(password));
}

export const PASSWORD_REQUIREMENTS_MESSAGE =
  "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a number.";
