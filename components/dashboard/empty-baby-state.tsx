import Link from "next/link";
import { Baby as BabyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function EmptyBabyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-zinc-300 py-24 text-center dark:border-zinc-700">
      <BabyIcon className="h-10 w-10 text-teal-500" />
      <p className="max-w-sm text-sm text-zinc-500">
        Add a baby profile first to start tracking.
      </p>
      <Link href="/babies/new">
        <Button>Add a baby</Button>
      </Link>
    </div>
  );
}
