import { Droplet, Moon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { shortRelativeTime } from "@/lib/format";
import type { PredictionResult } from "@/lib/predictions";

export function PredictionBanner({
  feeding,
  sleep,
}: {
  feeding: PredictionResult;
  sleep: PredictionResult;
}) {
  if (!feeding && !sleep) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Predicted next</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {feeding && <PredictionRow icon={Droplet} tint="text-pink-600" label="Feeding" prediction={feeding} />}
        {sleep && <PredictionRow icon={Moon} tint="text-indigo-600" label="Sleep" prediction={sleep} />}
      </CardContent>
    </Card>
  );
}

function PredictionRow({
  icon: Icon,
  tint,
  label,
  prediction,
}: {
  icon: typeof Droplet;
  tint: string;
  label: string;
  prediction: NonNullable<PredictionResult>;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 ${tint}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-xs font-medium text-zinc-500">{label}</p>
        <p className="text-lg font-semibold">{shortRelativeTime(prediction.predictedTime)}</p>
        <p className="text-xs text-zinc-400">{Math.round(prediction.confidence * 100)}% confidence</p>
      </div>
    </div>
  );
}
