import { X, ThumbsUp, ThumbsDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { dismissTip, rateTip } from "@/lib/actions/tips";
import type { Tip } from "@/app/generated/prisma/client";

export function TipsPanel({ tips }: { tips: Tip[] }) {
  if (tips.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tips for this stage</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
        {tips.map((tip) => (
          <div key={tip.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
            <div className="flex-1">
              <Badge className="mb-1">{cap(tip.category)}</Badge>
              <p className="text-sm">{tip.content}</p>
              {tip.usefulFeedback === null && (
                <div className="mt-2 flex gap-2">
                  <form action={rateTip}>
                    <input type="hidden" name="id" value={tip.id} />
                    <input type="hidden" name="useful" value="true" />
                    <button
                      type="submit"
                      className="flex items-center gap-1 text-xs text-zinc-400 hover:text-emerald-600"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" /> Useful
                    </button>
                  </form>
                  <form action={rateTip}>
                    <input type="hidden" name="id" value={tip.id} />
                    <input type="hidden" name="useful" value="false" />
                    <button
                      type="submit"
                      className="flex items-center gap-1 text-xs text-zinc-400 hover:text-rose-600"
                    >
                      <ThumbsDown className="h-3.5 w-3.5" /> Not useful
                    </button>
                  </form>
                </div>
              )}
            </div>
            <form action={dismissTip}>
              <input type="hidden" name="id" value={tip.id} />
              <button
                type="submit"
                aria-label="Dismiss tip"
                className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function cap(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}
