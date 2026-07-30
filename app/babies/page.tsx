import Link from "next/link";
import { Plus, Check } from "lucide-react";
import { prisma } from "@/lib/db";
import { getCurrentBaby } from "@/lib/current-baby";
import { deleteBaby, selectBaby } from "@/lib/actions/babies";
import { deleteCaregiver } from "@/lib/actions/caregivers";
import { formatAge, formatDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { DeleteButton } from "@/components/trackers/delete-button";

export default async function BabiesPage() {
  const { babies, current } = await getCurrentBaby();
  const caregivers = await prisma.caregiver.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Babies</h1>
        <Link href="/babies/new">
          <Button size="sm">
            <Plus className="h-4 w-4" /> Add baby
          </Button>
        </Link>
      </div>

      {babies.length === 0 ? (
        <p className="text-sm text-zinc-500">No babies yet. Add one to get started.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {babies.map((baby) => (
            <Card key={baby.id}>
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{baby.name}</p>
                    <p className="text-xs text-zinc-500">
                      {formatAge(baby.dob)} · born {formatDate(baby.dob)}
                    </p>
                  </div>
                  {baby.id === current?.id && <Badge variant="teal">Active</Badge>}
                </div>
                {baby.notes && <p className="text-sm text-zinc-500">{baby.notes}</p>}
                <div className="flex flex-wrap items-center gap-2">
                  {baby.id !== current?.id && (
                    <form action={selectBaby}>
                      <input type="hidden" name="babyId" value={baby.id} />
                      <SubmitButton size="sm" variant="secondary">
                        <Check className="h-3.5 w-3.5" /> Switch to
                      </SubmitButton>
                    </form>
                  )}
                  <Link href={`/babies/${baby.id}/edit`}>
                    <Button size="sm" variant="outline" type="button">
                      Edit
                    </Button>
                  </Link>
                  <form action={deleteBaby}>
                    <input type="hidden" name="babyId" value={baby.id} />
                    <DeleteButton confirmLabel={`Delete ${baby.name} and all of their logs?`} />
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Caregivers</h2>
        <Link href="/caregivers/new">
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4" /> Add caregiver
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Who logs for this baby</CardTitle>
        </CardHeader>
        <CardContent>
          {caregivers.length === 0 ? (
            <p className="text-sm text-zinc-500">No caregivers added yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
              {caregivers.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.name}</span>
                    <Badge>{c.role}</Badge>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link href={`/caregivers/${c.id}/edit`}>
                      <Button size="sm" variant="outline" type="button">
                        Edit
                      </Button>
                    </Link>
                    <form action={deleteCaregiver}>
                      <input type="hidden" name="caregiverId" value={c.id} />
                      <DeleteButton confirmLabel={`Remove ${c.name}?`} />
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
