import Link from "next/link";
import { Baby as BabyIcon, TrendingUp, Sparkles, Users, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";

const links = [
  { href: "/diaper", label: "Diaper", description: "Wet, dirty, and mixed changes", icon: BabyIcon },
  { href: "/growth", label: "Growth", description: "Weight, height, and head circumference", icon: TrendingUp },
  { href: "/milestones", label: "Milestones", description: "First smiles, steps, and more", icon: Sparkles },
  { href: "/babies", label: "Babies & Caregivers", description: "Manage profiles", icon: Users },
];

export default function MorePage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">More</h1>
      <div className="flex flex-col gap-2">
        {links.map(({ href, label, description, icon: Icon }) => (
          <Link key={href} href={href}>
            <Card className="flex flex-row items-center gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{label}</p>
                <p className="text-sm text-zinc-500">{description}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
