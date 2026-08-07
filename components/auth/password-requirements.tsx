"use client";

import { Check, Circle } from "lucide-react";
import { PASSWORD_REQUIREMENTS } from "@/lib/password-requirements";
import { cn } from "@/lib/utils";

/** Live checklist — each row flips to met/teal the instant its rule passes. */
export function PasswordRequirements({ password }: { password: string }) {
  return (
    <ul className="mt-2 flex flex-col gap-1">
      {PASSWORD_REQUIREMENTS.map((req) => {
        const met = req.test(password);
        return (
          <li
            key={req.id}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors",
              met ? "text-teal-600 dark:text-teal-400" : "text-zinc-400",
            )}
          >
            {met ? (
              <Check className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <Circle className="h-3.5 w-3.5 shrink-0" />
            )}
            {req.label}
          </li>
        );
      })}
    </ul>
  );
}
