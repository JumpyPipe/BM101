import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { updateCaregiver } from "@/lib/actions/caregivers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";

export default async function EditCaregiverPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caregiver = await prisma.caregiver.findUnique({ where: { id } });
  if (!caregiver) notFound();

  const updateCaregiverWithId = updateCaregiver.bind(null, caregiver.id);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Edit {caregiver.name}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Caregiver</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updateCaregiverWithId} className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" defaultValue={caregiver.name} required />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Input id="role" name="role" defaultValue={caregiver.role} required />
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
