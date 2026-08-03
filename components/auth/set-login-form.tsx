"use client";

import { useActionState } from "react";
import { setCaregiverLogin, type ActionState } from "@/lib/actions/auth";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function SetLoginForm({
  caregiverId,
  currentEmail,
}: {
  caregiverId: string;
  currentEmail: string | null;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(setCaregiverLogin, null);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="caregiverId" value={caregiverId} />
      <div>
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={currentEmail ?? ""}
          required
        />
      </div>
      <div>
        <Label htmlFor="login-password">
          {currentEmail ? "New password" : "Password"}
        </Label>
        <Input
          id="login-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          placeholder={currentEmail ? "Leave blank to keep current password" : undefined}
          required={!currentEmail}
        />
        <p className="mt-1 text-xs text-zinc-400">At least 8 characters.</p>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton className="w-fit">{currentEmail ? "Update login" : "Set up login"}</SubmitButton>
    </form>
  );
}
