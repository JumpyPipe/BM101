import Link from "next/link";
import { Milk, Moon, Baby as BabyIcon, TrendingUp, Sparkles } from "lucide-react";
import { getCurrentBaby } from "@/lib/current-baby";
import { prisma } from "@/lib/db";
import { formatAge, formatDateTime, formatDuration, relativeTime, shortRelativeTime, startOfToday } from "@/lib/format";
import { predictNextFeeding, predictNextSleep } from "@/lib/predictions";
import { getDueTips } from "@/lib/tips";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SummaryCard } from "@/components/dashboard/summary-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { InsightsPanel, type InsightDTO } from "@/components/dashboard/insights-panel";
import { PredictionBanner } from "@/components/dashboard/prediction-banner";
import { TipsPanel } from "@/components/dashboard/tips-panel";
import { QuickNote } from "@/components/dashboard/quick-note";

export default async function DashboardPage() {
  const { current } = await getCurrentBaby();

  if (!current) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-zinc-300 py-24 text-center dark:border-zinc-700">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950">
          <BabyIcon className="h-8 w-8 text-teal-500" />
        </div>
        <h1 className="font-fredoka text-xl font-semibold">Welcome to Snug</h1>
        <p className="max-w-sm text-sm text-zinc-500">
          Add your baby&apos;s profile to start tracking feedings, sleep, diapers, growth, and
          milestones.
        </p>
        <Link href="/babies/new">
          <Button>Add your first baby</Button>
        </Link>
      </div>
    );
  }

  const babyId = current.id;
  const today = startOfToday();

  const [
    lastFeeding,
    lastSleep,
    ongoingSleep,
    diapersToday,
    lastGrowth,
    recentMilestone,
    insights,
    feedingPrediction,
    sleepPrediction,
    dueTips,
  ] = await Promise.all([
    prisma.feedingLog.findFirst({ where: { babyId }, orderBy: { startedAt: "desc" } }),
    prisma.sleepLog.findFirst({
      where: { babyId, endedAt: { not: null } },
      orderBy: { startedAt: "desc" },
    }),
    prisma.sleepLog.findFirst({ where: { babyId, endedAt: null }, orderBy: { startedAt: "desc" } }),
    prisma.diaperLog.count({ where: { babyId, occurredAt: { gte: today } } }),
    prisma.growthLog.findFirst({ where: { babyId }, orderBy: { measuredAt: "desc" } }),
    prisma.milestone.findFirst({ where: { babyId }, orderBy: { occurredAt: "desc" } }),
    prisma.insight.findMany({ where: { babyId }, orderBy: { createdAt: "desc" }, take: 5 }),
    predictNextFeeding(babyId),
    predictNextSleep(babyId),
    getDueTips(babyId),
  ]);

  const [feedingLogs, sleepLogs, diaperLogs] = await Promise.all([
    prisma.feedingLog.findMany({ where: { babyId }, orderBy: { startedAt: "desc" }, take: 5 }),
    prisma.sleepLog.findMany({ where: { babyId }, orderBy: { startedAt: "desc" }, take: 5 }),
    prisma.diaperLog.findMany({ where: { babyId }, orderBy: { occurredAt: "desc" }, take: 5 }),
  ]);

  const activity = [
    ...feedingLogs.map((l) => ({ kind: "Feeding", at: l.startedAt, label: feedingLabel(l) })),
    ...sleepLogs.map((l) => ({ kind: "Sleep", at: l.startedAt, label: sleepLabel(l) })),
    ...diaperLogs.map((l) => ({ kind: "Diaper", at: l.occurredAt, label: `${cap(l.type)} diaper` })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 8);

  const insightDTOs: InsightDTO[] = insights.map((i) => ({
    ...i,
    createdAt: i.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-fredoka text-2xl font-semibold">{current.name}</h1>
        <p className="text-sm text-zinc-500">{formatAge(current.dob)}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <SummaryCard
          icon={Milk}
          label="Last feeding"
          value={lastFeeding ? shortRelativeTime(lastFeeding.startedAt) : "No data"}
          hint={lastFeeding ? cap(lastFeeding.type.toLowerCase()) : undefined}
        />
        <SummaryCard
          icon={Moon}
          label={ongoingSleep ? "Sleeping now" : "Last sleep"}
          value={
            ongoingSleep
              ? shortRelativeTime(ongoingSleep.startedAt)
              : lastSleep
                ? shortRelativeTime(lastSleep.startedAt)
                : "No data"
          }
          hint={
            ongoingSleep
              ? "In progress"
              : lastSleep?.endedAt
                ? formatDuration((lastSleep.endedAt.getTime() - lastSleep.startedAt.getTime()) / 60000)
                : undefined
          }
        />
        <SummaryCard icon={BabyIcon} label="Diapers today" value={String(diapersToday)} />
        <SummaryCard
          icon={TrendingUp}
          label="Latest weight"
          value={lastGrowth?.weightKg ? `${lastGrowth.weightKg} kg` : "No data"}
          hint={lastGrowth ? shortRelativeTime(lastGrowth.measuredAt) : undefined}
        />
      </div>

      <QuickNote babyId={babyId} />

      <PredictionBanner feeding={feedingPrediction} sleep={sleepPrediction} />

      <QuickActions babyId={babyId} />

      <TipsPanel tips={dueTips} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-sm text-zinc-500">Nothing logged yet.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
                {activity.map((item, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Badge>{item.kind}</Badge>
                      <span>{item.label}</span>
                    </div>
                    <span className="shrink-0 text-xs text-zinc-400">
                      {formatDateTime(item.at)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <InsightsPanel babyId={babyId} initialInsights={insightDTOs} />
      </div>

      {recentMilestone && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" /> Latest milestone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{recentMilestone.title}</p>
            <p className="text-sm text-zinc-500">
              {recentMilestone.category} · {relativeTime(recentMilestone.occurredAt)}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function cap(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

function feedingLabel(l: { type: string; amountMl: number | null; durationMin: number | null }) {
  if (l.type === "BOTTLE" && l.amountMl) return `Bottle · ${l.amountMl}ml`;
  if (l.type === "BREAST" && l.durationMin) return `Breast · ${formatDuration(l.durationMin)}`;
  if (l.type === "SOLID") return "Solids";
  return cap(l.type.toLowerCase());
}

function sleepLabel(l: { type: string; startedAt: Date; endedAt: Date | null }) {
  const kind = l.type === "NAP" ? "Nap" : "Night sleep";
  if (!l.endedAt) return `${kind} (ongoing)`;
  return `${kind} · ${formatDuration((l.endedAt.getTime() - l.startedAt.getTime()) / 60000)}`;
}
