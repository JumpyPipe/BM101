import { format } from "date-fns";
import { getCurrentBaby } from "@/lib/current-baby";
import { prisma } from "@/lib/db";
import { createDiaperLog, deleteDiaperLog } from "@/lib/actions/diaper";
import { formatDateTime, toDatetimeLocal } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Select } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { DeleteButton } from "@/components/trackers/delete-button";
import { TrendChart } from "@/components/trackers/trend-chart";
import { EmptyBabyState } from "@/components/dashboard/empty-baby-state";

const badgeVariant = { WET: "blue", DIRTY: "amber", MIXED: "green" } as const;

export default async function DiaperPage() {
  const { current } = await getCurrentBaby();
  if (!current) return <EmptyBabyState />;

  const logs = await prisma.diaperLog.findMany({
    where: { babyId: current.id },
    orderBy: { occurredAt: "desc" },
    take: 50,
  });

  const chartData = buildDailyCounts(logs.map((l) => l.occurredAt));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-fredoka text-2xl font-semibold">Diaper</h1>

      <Card id="log">
        <CardHeader>
          <CardTitle>Log a diaper change</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createDiaperLog} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <input type="hidden" name="babyId" value={current.id} />
            <div>
              <Label htmlFor="type">Type</Label>
              <Select id="type" name="type" defaultValue="WET">
                <option value="WET">Wet</option>
                <option value="DIRTY">Dirty</option>
                <option value="MIXED">Mixed</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="occurredAt">Time</Label>
              <Input
                id="occurredAt"
                name="occurredAt"
                type="datetime-local"
                defaultValue={toDatetimeLocal(new Date())}
                required
              />
            </div>
            <div className="flex items-end">
              <SubmitButton className="w-full">Log diaper</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Diapers per day (last 14 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart data={chartData} unit="" color="#0891b2" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-zinc-500">No diapers logged yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
              {logs.map((log) => (
                <li key={log.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <Badge variant={badgeVariant[log.type]}>{cap(log.type)}</Badge>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-zinc-400">{formatDateTime(log.occurredAt)}</span>
                    <form action={deleteDiaperLog}>
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

function cap(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

function buildDailyCounts(dates: Date[]) {
  const counts = new Map<string, number>();
  for (const d of dates) {
    const key = format(d, "yyyy-MM-dd");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const days: { label: string; value: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = format(d, "yyyy-MM-dd");
    days.push({ label: format(d, "M/d"), value: counts.get(key) ?? 0 });
  }
  return days;
}
