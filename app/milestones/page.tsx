import { getCurrentBaby } from "@/lib/current-baby";
import { prisma } from "@/lib/db";
import { createMilestone, deleteMilestone } from "@/lib/actions/milestones";
import { formatDate, toDatetimeLocal } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { DeleteButton } from "@/components/trackers/delete-button";
import { EmptyBabyState } from "@/components/dashboard/empty-baby-state";

const categories = ["Motor", "Social", "Language", "Cognitive", "Feeding", "Other"];

export default async function MilestonesPage() {
  const { current } = await getCurrentBaby();
  if (!current) return <EmptyBabyState />;

  const milestones = await prisma.milestone.findMany({
    where: { babyId: current.id },
    orderBy: { occurredAt: "desc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-fredoka text-2xl font-semibold">Milestones</h1>

      <Card id="log">
        <CardHeader>
          <CardTitle>Log a milestone</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createMilestone} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <input type="hidden" name="babyId" value={current.id} />
            <div className="col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" placeholder="e.g. First steps" required />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select id="category" name="category" defaultValue="Motor">
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="occurredAt">Date</Label>
              <Input
                id="occurredAt"
                name="occurredAt"
                type="datetime-local"
                defaultValue={toDatetimeLocal(new Date())}
                required
              />
            </div>
            <div className="col-span-2 sm:col-span-4">
              <Label htmlFor="description">Notes</Label>
              <Textarea id="description" name="description" rows={2} placeholder="Optional" />
            </div>
            <div className="col-span-2 sm:col-span-4">
              <SubmitButton>Log milestone</SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          {milestones.length === 0 ? (
            <p className="text-sm text-zinc-500">No milestones logged yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
              {milestones.map((m) => (
                <li key={m.id} className="flex items-start justify-between gap-3 py-3 text-sm">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant="amber">{m.category}</Badge>
                      <span className="font-medium">{m.title}</span>
                    </div>
                    {m.description && (
                      <p className="text-zinc-500 dark:text-zinc-400">{m.description}</p>
                    )}
                    <p className="text-xs text-zinc-400">{formatDate(m.occurredAt)}</p>
                  </div>
                  <form action={deleteMilestone}>
                    <input type="hidden" name="id" value={m.id} />
                    <DeleteButton />
                  </form>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
