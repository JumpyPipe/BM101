"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startAuthentication } from "@simplewebauthn/browser";
import { login, type ActionState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const [state, formAction] = useActionState<ActionState, FormData>(login, null);
  const [faceIdError, setFaceIdError] = useState<string | null>(null);
  const [faceIdPending, startFaceId] = useTransition();
  const router = useRouter();

  function handleFaceId() {
    setFaceIdError(null);
    startFaceId(async () => {
      try {
        const optionsRes = await fetch("/api/webauthn/login-options", { method: "POST" });
        if (!optionsRes.ok) throw new Error("Could not start Face ID sign-in.");
        const options = await optionsRes.json();

        const authResponse = await startAuthentication({ optionsJSON: options });

        const verifyRes = await fetch("/api/webauthn/login-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(authResponse),
        });
        if (!verifyRes.ok) {
          const data = await verifyRes.json().catch(() => null);
          throw new Error(data?.error ?? "Face ID sign-in failed.");
        }

        router.push(nextPath && nextPath.startsWith("/") ? nextPath : "/");
        router.refresh();
      } catch (e) {
        if (e instanceof Error && e.name === "NotAllowedError") {
          setFaceIdError("Face ID sign-in was cancelled.");
        } else {
          setFaceIdError(e instanceof Error ? e.message : "Face ID sign-in failed.");
        }
      }
    });
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <Button type="button" variant="outline" size="lg" onClick={handleFaceId} disabled={faceIdPending}>
        {faceIdPending ? "Waiting for Face ID…" : "Sign in with Face ID"}
      </Button>
      {faceIdError && <p className="text-center text-sm text-red-600">{faceIdError}</p>}

      <div className="flex items-center gap-3 text-xs text-zinc-400">
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        or
        <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      </div>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="next" value={nextPath ?? ""} />
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <SubmitButton className="w-full" size="lg">
          Sign in
        </SubmitButton>
      </form>
    </div>
  );
}
