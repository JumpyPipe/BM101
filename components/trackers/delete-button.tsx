"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteButton({ confirmLabel = "Delete this entry?" }: { confirmLabel?: string }) {
  return (
    <Button
      type="submit"
      variant="ghost"
      size="icon"
      className="text-zinc-400 hover:text-red-600"
      onClick={(e) => {
        if (!confirm(confirmLabel)) e.preventDefault();
      }}
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
