"use client";

import { useActionState, useState } from "react";
import { signUp, type ActionState } from "@/lib/actions/auth";
import { meetsPasswordRequirements } from "@/lib/password-requirements";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { PasswordRequirements } from "@/components/auth/password-requirements";

export function SignUpForm({ nextPath }: { nextPath?: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(signUp, null);
  const [password, setPassword] = useState("");

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <input type="hidden" name="next" value={nextPath ?? ""} />
      <div>
        <Label htmlFor="name">Your name</Label>
        <Input id="name" name="name" autoComplete="name" required />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <PasswordRequirements password={password} />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton className="w-full" size="lg" disabled={!meetsPasswordRequirements(password)}>
        Create account
      </SubmitButton>
    </form>
  );
}
