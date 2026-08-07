"use client";

import { useActionState } from "react";
import { createInvite, type ActionState } from "@/lib/actions/invites";
import { Label, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function CreateInviteForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(createInvite, null);

  return (
    <form action={formAction} className="flex flex-col gap-4 sm:flex-row sm:items-end">
      <div className="flex-1">
        <Label htmlFor="role">Role</Label>
        <Select id="role" name="role" defaultValue="MEMBER">
          <option value="MEMBER">Caregiver</option>
          <option value="OWNER">Co-owner</option>
        </Select>
      </div>
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <SubmitButton>Create invite link</SubmitButton>
    </form>
  );
}
