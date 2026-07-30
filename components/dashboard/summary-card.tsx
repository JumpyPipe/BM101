import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SummaryCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
            accent,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="truncate text-lg font-semibold">{value}</p>
          {hint && <p className="text-xs text-zinc-400">{hint}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
