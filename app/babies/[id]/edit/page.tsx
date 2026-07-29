import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { updateBaby } from "@/lib/actions/babies";
import { toDatetimeLocal } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";

export default async function EditBabyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const baby = await prisma.baby.findUnique({ where: { id } });
  if (!baby) notFound();

  const updateBabyWithId = updateBaby.bind(null, baby.id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Edit {baby.name}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Baby profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateBabyWithId} className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={baby.name} required />
            </div>
            <div>
              <Label htmlFor="dob">Date of birth</Label>
              <Input
                id="dob"
                name="dob"
                type="date"
                defaultValue={toDatetimeLocal(baby.dob).slice(0, 10)}
                required
              />
            </div>
            <div>
              <Label htmlFor="sex">Sex</Label>
              <Select id="sex" name="sex" defaultValue={baby.sex}>
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
                <option value="UNKNOWN">Prefer not to say</option>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={3} defaultValue={baby.notes ?? ""} />
            </div>
            <div className="col-span-2 flex gap-2">
              <SubmitButton>Save changes</SubmitButton>
              <Link href="/babies">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
