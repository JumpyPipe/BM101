import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
        rose: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
        blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
        amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
        green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
        violet: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
