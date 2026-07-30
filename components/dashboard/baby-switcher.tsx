"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { selectBaby } from "@/lib/actions/babies";
import { Select } from "@/components/ui/input";
import type { Baby } from "@/app/generated/prisma/client";

export function BabySwitcher({ babies, currentId }: { babies: Baby[]; currentId: string }) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (babies.length === 0) return null;

  return (
    <Select
      className="h-9 w-auto min-w-[9rem]"
      value={currentId}
      disabled={isPending}
      onChange={(e) => {
        const formData = new FormData();
        formData.set("babyId", e.target.value);
        startTransition(async () => {
          await selectBaby(formData);
          router.refresh();
        });
      }}
    >
      {babies.map((baby) => (
        <option key={baby.id} value={baby.id}>
          {baby.name}
        </option>
      ))}
    </Select>
  );
}
