import Link from "next/link";
import { Droplets, Milk, Moon } from "lucide-react";
import { quickLogDiaper } from "@/lib/actions/diaper";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";

export function QuickActions({ babyId }: { babyId: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick log</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <form action={quickLogDiaper}>
          <input type="hidden" name="babyId" value={babyId} />
          <input type="hidden" name="type" value="WET" />
          <SubmitButton variant="outline" size="sm">
            <Droplets className="h-4 w-4" /> Wet diaper
          </SubmitButton>
        </form>
        <form action={quickLogDiaper}>
          <input type="hidden" name="babyId" value={babyId} />
          <input type="hidden" name="type" value="DIRTY" />
          <SubmitButton variant="outline" size="sm">
            <Droplets className="h-4 w-4" /> Dirty diaper
          </SubmitButton>
        </form>
        <Link href="/feeding#log">
          <SubmitButtonLink icon={<Milk className="h-4 w-4" />} label="Log feeding" />
        </Link>
        <Link href="/sleep#log">
          <SubmitButtonLink icon={<Moon className="h-4 w-4" />} label="Log sleep" />
        </Link>
      </CardContent>
    </Card>
  );
}

function SubmitButtonLink({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex h-8 items-center gap-2 rounded-lg border border-zinc-300 px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
      {icon} {label}
    </span>
  );
}
