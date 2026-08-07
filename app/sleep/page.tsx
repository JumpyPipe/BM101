import { format } from "date-fns";
import { getCurrentBaby } from "@/lib/current-baby";
import { requireCurrentHousehold } from "@/lib/household";
import { prisma } from "@/lib/db";
import { createSleepLog, deleteSleepLog, endSleepLog } from "@/lib/actions/sleep";
import { formatDateTime, formatDuration, toDatetimeLocal } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { DeleteButton } from "@/components/trackers/delete-button";
import { TrendChart } from "@/components/trackers/trend-chart";
import { EmptyBabyState } from "@/components/dashboard/empty-baby-state";

export default async function SleepPage() {
  const { household } = await requireCurrentHousehold();
  const { current } = await getCurrentBaby(household.id);
  if (!current) return <EmptyBabyState />;

  const logs = await prisma.sleepLog.findMany({
    where: { babyId: current.id },
    orderBy: { startedAt: "desc" },
    take: 50,
  });

  const chartData = buildDailyHours(logs);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-fredoka text-2xl font-semibold">Sleep</h1>

      <Card id="log">
        <CardHeader>
          <CardTitle>Log sleep</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createSleepLog} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <input type="hidden" name="babyId" value={current.id} />
            <div>
              <Label htmlFor="type">Type</Label>
              <Select id="type" name="type" defaultValue="NAP">
                <option value="NAP">Nap</option>
                <option value="NIGHT">Night sleep</option>
              </Select>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="startedAt">Start</Label>
              <Input
                id="startedAt"
                name="startedAt"
                type="datetime-local"
                defaultValue={toDatetimeLocal(new Date())}
                required
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="endedAt">End (leave blank if ongoing)</Label>
              <Input id="endedAt" name="endedAt" type="datetime-local" />
            </div>
            <div className="flex items-end">
              <SubmitButton className="w-full">Log sleep</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sleep hours per day (last 14 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart data={chartData} unit="h" color="#6366f1" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-zinc-500">No sleep logged yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
              {logs.map((log) => (
                <li key={log.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="violet">{log.type === "NAP" ? "Nap" : "Night"}</Badge>
                    <span>
                      {log.endedAt
                        ? formatDuration((log.endedAt.getTime() - log.startedAt.getTime()) / 60000)
                        : "Ongoing"}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-zinc-400">{formatDateTime(log.startedAt)}</span>
                    {!log.endedAt && (
                      <form action={endSleepLog}>
                        <input type="hidden" name="id" value={log.id} />
                        <SubmitButton size="sm" variant="secondary">
                          End now
                        </SubmitButton>
                      </form>
                    )}
                    <form action={deleteSleepLog}>
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

function buildDailyHours(logs: { startedAt: Date; endedAt: Date | null }[]) {
  const totals = new Map<string, number>();
  for (const log of logs) {
    if (!log.endedAt) continue;
    const key = format(log.startedAt, "yyyy-MM-dd");
    const hours = (log.endedAt.getTime() - log.startedAt.getTime()) / 3_600_000;
    totals.set(key, (totals.get(key) ?? 0) + hours);
  }
  const days: { label: string; value: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = format(d, "yyyy-MM-dd");
    days.push({ label: format(d, "M/d"), value: Math.round((totals.get(key) ?? 0) * 10) / 10 });
  }
  return days;
}
