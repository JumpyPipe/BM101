"use client";

import { useActionState } from "react";
import { signUp, type ActionState } from "@/lib/actions/auth";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function SignUpForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(signUp, null);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
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
          required
        />
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton className="w-full" size="lg">
        Create account
      </SubmitButton>
    </form>
  );
}
