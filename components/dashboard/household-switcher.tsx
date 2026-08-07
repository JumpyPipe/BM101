"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { switchHousehold } from "@/lib/actions/household";
import { Select } from "@/components/ui/input";
import type { HouseholdWithRole } from "@/lib/household";

/**
 * Only relevant once a caregiver belongs to more than one household (their
 * own + one they joined via invite, most commonly) — hidden entirely for
 * the common single-household case.
 */
export function HouseholdSwitcher({
  households,
  currentId,
}: {
  households: HouseholdWithRole[];
  currentId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (households.length <= 1) return null;

  return (
    <Select
      className="h-9 w-auto min-w-[9rem]"
      value={currentId}
      disabled={isPending}
      onChange={(e) => {
        const formData = new FormData();
        formData.set("householdId", e.target.value);
        startTransition(async () => {
          await switchHousehold(formData);
          router.refresh();
        });
      }}
    >
      {households.map((h) => (
        <option key={h.id} value={h.id}>
          {h.name}
        </option>
      ))}
    </Select>
  );
}
