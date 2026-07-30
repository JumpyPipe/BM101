import Link from "next/link";
import { Baby as BabyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyBabyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-zinc-300 py-24 text-center dark:border-zinc-700">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950">
        <BabyIcon className="h-8 w-8 text-teal-500" />
      </div>
      <p className="max-w-sm text-sm text-zinc-500">
        Add a baby profile first to start tracking.
      </p>
      <Link href="/babies/new">
        <Button>Add a baby</Button>
      </Link>
    </div>
  );
}
