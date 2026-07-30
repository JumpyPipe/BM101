"use client";

import { useState } from "react";
import { createFeedingLog } from "@/lib/actions/feeding";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { toDatetimeLocal } from "@/lib/format";

export function FeedingForm({ babyId }: { babyId: string }) {
  const [type, setType] = useState<"BREAST" | "BOTTLE" | "SOLID">("BOTTLE");

  return (
    <form action={createFeedingLog} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <input type="hidden" name="babyId" value={babyId} />

      <div className="col-span-2 sm:col-span-1">
        <Label htmlFor="type">Type</Label>
        <Select
          id="type"
          name="type"
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
        >
          <option value="BOTTLE">Bottle</option>
          <option value="BREAST">Breast</option>
          <option value="SOLID">Solid</option>
        </Select>
      </div>

      {type === "BREAST" && (
        <div>
          <Label htmlFor="side">Side</Label>
          <Select id="side" name="side" defaultValue="LEFT">
            <option value="LEFT">Left</option>
            <option value="RIGHT">Right</option>
            <option value="BOTH">Both</option>
          </Select>
        </div>
      )}

      {type === "BREAST" ? (
        <div>
          <Label htmlFor="durationMin">Duration (min)</Label>
          <Input id="durationMin" name="durationMin" type="number" min={0} step="1" />
        </div>
      ) : (
        <div>
          <Label htmlFor="amountMl">Amount (ml)</Label>
          <Input id="amountMl" name="amountMl" type="number" min={0} step="1" />
        </div>
      )}

      <div>
        <Label htmlFor="startedAt">Time</Label>
        <Input
          id="startedAt"
          name="startedAt"
          type="datetime-local"
          defaultValue={toDatetimeLocal(new Date())}
          required
        />
      </div>

      <div className="col-span-2 sm:col-span-4">
        <Label htmlFor="note">Note</Label>
        <Textarea id="note" name="note" rows={2} placeholder="Optional" />
      </div>

      <div className="col-span-2 sm:col-span-4">
        <SubmitButton>Log feeding</SubmitButton>
      </div>
    </form>
  );
}
