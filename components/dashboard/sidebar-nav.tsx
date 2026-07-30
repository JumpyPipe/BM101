"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Milk,
  Moon,
  Baby as BabyIcon,
  TrendingUp,
  Sparkles,
  MessageCircle,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/feeding", label: "Feeding", icon: Milk },
  { href: "/sleep", label: "Sleep", icon: Moon },
  { href: "/diaper", label: "Diaper", icon: BabyIcon },
  { href: "/growth", label: "Growth", icon: TrendingUp },
  { href: "/milestones", label: "Milestones", icon: Sparkles },
  { href: "/assistant", label: "Assistant", icon: MessageCircle },
  { href: "/babies", label: "Babies & Caregivers", icon: Users },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto px-2 py-2 lg:flex-col lg:overflow-visible lg:px-3 lg:py-4">
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-3 rounded-full px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-teal-600 text-white"
                : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
