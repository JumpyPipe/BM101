"use client";

import { useActionState } from "react";
import { claimAccount, type ActionState } from "@/lib/actions/auth";
import { Input, Label, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function ClaimForm({
  caregivers,
}: {
  caregivers: { id: string; name: string; role: string }[];
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(claimAccount, null);

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <div>
        <Label htmlFor="caregiverId">You are</Label>
        <Select id="caregiverId" name="caregiverId" required defaultValue="">
          <option value="" disabled>
            Select your name
          </option>
          {caregivers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.role})
            </option>
          ))}
        </Select>
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
          required
          minLength={8}
        />
        <p className="mt-1 text-xs text-zinc-400">At least 8 characters.</p>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton className="w-full" size="lg">
        Create my login
      </SubmitButton>
    </form>
  );
}
