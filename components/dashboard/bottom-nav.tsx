"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Milk, Moon, MessageCircle, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/feeding", label: "Feeding", icon: Milk },
  { href: "/sleep", label: "Sleep", icon: Moon },
  { href: "/assistant", label: "Assistant", icon: MessageCircle },
  { href: "/more", label: "More", icon: MoreHorizontal },
];

/** Fixed bottom tab bar for phones — replaces the sidebar nav below `lg`. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/95 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="grid grid-cols-5">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex min-h-11 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium"
            >
              <span
                className={cn(
                  "flex h-7 w-11 items-center justify-center rounded-full transition-colors",
                  active && "bg-teal-100 dark:bg-teal-950",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5",
                    active ? "text-teal-600" : "text-zinc-400 dark:text-zinc-500",
                  )}
                />
              </span>
              <span className={cn(active ? "text-teal-600" : "text-zinc-500 dark:text-zinc-400")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
