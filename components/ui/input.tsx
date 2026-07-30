import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none placeholder:text-zinc-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-teal-900/40",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm outline-none placeholder:text-zinc-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-100 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-teal-900/40",
      className,
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "h-10 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-teal-900/40",
        className,
      )}
      {...props}
    />
  ),
);
Select.displayName = "Select";

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-400", className)}
      {...props}
    />
  );
}
