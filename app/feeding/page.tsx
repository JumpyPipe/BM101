import { format } from "date-fns";
import { getCurrentBaby } from "@/lib/current-baby";
import { prisma } from "@/lib/db";
import { deleteFeedingLog } from "@/lib/actions/feeding";
import { formatDateTime, formatDuration } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FeedingForm } from "@/components/trackers/feeding-form";
import { DeleteButton } from "@/components/trackers/delete-button";
import { TrendChart } from "@/components/trackers/trend-chart";
import { EmptyBabyState } from "@/components/dashboard/empty-baby-state";

export default async function FeedingPage() {
  const { current } = await getCurrentBaby();
  if (!current) return <EmptyBabyState />;

  const logs = await prisma.feedingLog.findMany({
    where: { babyId: current.id },
    orderBy: { startedAt: "desc" },
    take: 50,
  });

  const chartData = buildDailyCounts(logs.map((l) => l.startedAt));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-fredoka text-2xl font-semibold">Feeding</h1>

      <Card id="log">
        <CardHeader>
          <CardTitle>Log a feeding</CardTitle>
        </CardHeader>
        <CardContent>
          <FeedingForm babyId={current.id} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Feedings per day (last 14 days)</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendChart data={chartData} unit=" feeds" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>History</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-zinc-500">No feedings logged yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
              {logs.map((log) => (
                <li key={log.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="teal">{cap(log.type)}</Badge>
                    <span>
                      {log.side ? `${cap(log.side)} · ` : ""}
                      {log.amountMl ? `${log.amountMl}ml` : ""}
                      {log.durationMin ? formatDuration(log.durationMin) : ""}
                    </span>
                    {log.note && <span className="text-zinc-400">— {log.note}</span>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs text-zinc-400">{formatDateTime(log.startedAt)}</span>
                    <form action={deleteFeedingLog}>
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
  const days: { label: string; value: number }[] = [];
  const counts = new Map<string, number>();
  for (const d of dates) {
    const key = format(d, "yyyy-MM-dd");
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = format(d, "yyyy-MM-dd");
    days.push({ label: format(d, "M/d"), value: counts.get(key) ?? 0 });
  }
  return days;
}
