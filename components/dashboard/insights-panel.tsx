"use client";

import { useState, useTransition } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type InsightDTO = {
  id: string;
  category: string;
  severity: "INFO" | "TIP" | "ATTENTION";
  title: string;
  body: string;
  createdAt: string;
};

const severityVariant = {
  INFO: "blue",
  TIP: "green",
  ATTENTION: "amber",
} as const;

export function InsightsPanel({
  babyId,
  initialInsights,
}: {
  babyId: string;
  initialInsights: InsightDTO[];
}) {
  const [insights, setInsights] = useState(initialInsights);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function generate() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/insights", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ babyId }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Request failed (${res.status})`);
        }
        const data = await res.json();
        setInsights(data.insights);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      }
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-600" /> AI insights
        </CardTitle>
        <Button variant="ghost" size="sm" onClick={generate} disabled={isPending}>
          <RefreshCw className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`} />
          {isPending ? "Analyzing..." : "Refresh"}
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
            {error}
          </p>
        )}
        {insights.length === 0 && !error && (
          <p className="text-sm text-zinc-500">
            No insights yet. Log a few entries, then hit refresh to have the assistant look for
            patterns in feeding, sleep, and diaper data.
          </p>
        )}
        {insights.map((insight) => (
          <div
            key={insight.id}
            className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800"
          >
            <div className="mb-1 flex items-center gap-2">
              <Badge variant={severityVariant[insight.severity]}>{insight.category}</Badge>
              <span className="text-sm font-medium">{insight.title}</span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{insight.body}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
