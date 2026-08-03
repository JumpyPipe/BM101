"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startRegistration } from "@simplewebauthn/browser";
import { Button } from "@/components/ui/button";

export function FaceIdEnroll() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startPending] = useTransition();
  const router = useRouter();

  function handleEnroll() {
    setError(null);
    startPending(async () => {
      try {
        const optionsRes = await fetch("/api/webauthn/register-options", { method: "POST" });
        if (!optionsRes.ok) throw new Error("Could not start Face ID setup.");
        const options = await optionsRes.json();

        const registrationResponse = await startRegistration({ optionsJSON: options });

        const verifyRes = await fetch("/api/webauthn/register-verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...registrationResponse, deviceLabel: "Face ID / Passkey" }),
        });
        if (!verifyRes.ok) {
          const data = await verifyRes.json().catch(() => null);
          throw new Error(data?.error ?? "Face ID setup failed.");
        }

        router.refresh();
      } catch (e) {
        if (e instanceof Error && e.name === "NotAllowedError") {
          setError("Face ID setup was cancelled.");
        } else {
          setError(e instanceof Error ? e.message : "Face ID setup failed.");
        }
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" variant="outline" size="sm" onClick={handleEnroll} disabled={pending}>
        {pending ? "Waiting for Face ID…" : "Add Face ID / Passkey"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
