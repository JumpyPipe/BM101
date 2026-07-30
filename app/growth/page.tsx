import { format } from "date-fns";
import { getCurrentBaby } from "@/lib/current-baby";
import { prisma } from "@/lib/db";
import { createGrowthLog, deleteGrowthLog } from "@/lib/actions/growth";
import { formatDate, toDatetimeLocal } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { DeleteButton } from "@/components/trackers/delete-button";
import { TrendChart } from "@/components/trackers/trend-chart";
import { EmptyBabyState } from "@/components/dashboard/empty-baby-state";

export default async function GrowthPage() {
  const { current } = await getCurrentBaby();
  if (!current) return <EmptyBabyState />;

  const logs = await prisma.growthLog.findMany({
    where: { babyId: current.id },
    orderBy: { measuredAt: "asc" },
  });

  const weightData = logs
    .filter((l) => l.weightKg != null)
    .map((l) => ({ label: format(l.measuredAt, "M/d"), value: l.weightKg! }));
  const heightData = logs
    .filter((l) => l.heightCm != null)
    .map((l) => ({ label: format(l.measuredAt, "M/d"), value: l.heightCm! }));

  const reversed = [...logs].reverse();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-fredoka text-2xl font-semibold">Growth</h1>

      <Card id="log">
        <CardHeader>
          <CardTitle>Log a measurement</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createGrowthLog} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <input type="hidden" name="babyId" value={current.id} />
            <div>
              <Label htmlFor="weightKg">Weight (kg)</Label>
              <Input id="weightKg" name="weightKg" type="number" min={0} step="0.01" />
            </div>
            <div>
              <Label htmlFor="heightCm">Height (cm)</Label>
              <Input id="heightCm" name="heightCm" type="number" min={0} step="0.1" />
            </div>
            <div>
              <Label htmlFor="headCm">Head circumference (cm)</Label>
              <Input id="headCm" name="headCm" type="number" min={0} step="0.1" />
            </div>
            <div>
              <Label htmlFor="measuredAt">Date</Label>
              <Input
                id="measuredAt"
                name="measuredAt"
                type="datetime-local"
                defaultValue={toDatetimeLocal(new Date())}
                required
              />
            </div>
            <div className="col-span-2 sm:col-span-4">
              <Label htmlFor="note">Note</Label>
              <Textarea id="note" name="note" rows={2} placeholder="Optional" />
            </div>
            <div className="col-span-2 sm:col-span-4">
              <SubmitButton>Log measurement</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weight (kg)</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={weightData} unit="kg" color="#16a34a" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Height (cm)</CardTitle>
          </CardHeader>
          <CardContent>
            <TrendChart data={heightData} unit="cm" color="#2563eb" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          {reversed.length === 0 ? (
            <p className="text-sm text-zinc-500">No measurements logged yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
              {reversed.map((log) => (
                <li key={log.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="flex flex-wrap items-center gap-3">
                    {log.weightKg != null && <span>{log.weightKg} kg</span>}
                    {log.heightCm != null && <span>{log.heightCm} cm</span>}
                    {log.headCm != null && <span>head {log.headCm} cm</span>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-zinc-400">{formatDate(log.measuredAt)}</span>
                    <form action={deleteGrowthLog}>
                      <input type="hidden" name="id" value={log.id} />
                      <DeleteButton />
                    </form>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
