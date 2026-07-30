"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ParseResponse = {
  logged: boolean;
  kind?: string;
  clarification?: string;
  error?: string;
};

/**
 * Free-text logging — "fed 4oz bottle 10 min ago", "just woke up" — parsed
 * into a structured log entry by Claude (tool use) via the same
 * /api/v1/parse endpoint the iOS app uses. See PLANNING-iOS.md §4.
 */
export function QuickNote({ babyId }: { babyId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  function submit() {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessage(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/v1/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ babyId, text: trimmed }),
        });
        const data: ParseResponse = await res.json();
        if (!res.ok) {
          setMessage({ text: data.error ?? "Something went wrong.", isError: true });
          return;
        }
        if (data.logged) {
          setMessage({ text: `Logged as ${data.kind ?? "an event"}.`, isError: false });
          setText("");
          router.refresh();
        } else {
          setMessage({
            text: data.clarification ?? "Couldn't understand that — try being more specific.",
            isError: true,
          });
        }
      } catch {
        setMessage({ text: "Network error — check your connection.", isError: true });
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-rose-500" /> Quick note
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <p className="text-xs text-zinc-500">
          Describe what happened — e.g. &ldquo;fed 4oz bottle 10 min ago&rdquo; or &ldquo;just woke up&rdquo;.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="What happened?"
            disabled={isPending}
          />
          <Button onClick={submit} disabled={isPending || !text.trim()} className="sm:w-auto">
            {isPending ? "Logging…" : "Log it"}
          </Button>
        </div>
        {message && (
          <p className={`text-xs ${message.isError ? "text-rose-600" : "text-emerald-600"}`}>
            {message.text}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
