import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { updateCaregiver } from "@/lib/actions/caregivers";
import { deleteCredential } from "@/lib/actions/webauthn";
import { getCurrentCaregiver } from "@/lib/auth/current-caregiver";
import { requireCurrentHousehold, isHouseholdMember } from "@/lib/household";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";
import { SetLoginForm } from "@/components/auth/set-login-form";
import { FaceIdEnroll } from "@/components/auth/faceid-enroll";
import { ScanFace, Trash2 } from "lucide-react";

export default async function EditCaregiverPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { household } = await requireCurrentHousehold();
  if (!(await isHouseholdMember(household.id, id))) notFound();
  const [caregiver, self] = await Promise.all([
    prisma.caregiver.findUnique({ where: { id }, include: { credentials: true } }),
    getCurrentCaregiver(),
  ]);
  if (!caregiver) notFound();

  const updateCaregiverWithId = updateCaregiver.bind(null, caregiver.id);
  const isSelf = self?.id === caregiver.id;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-fredoka text-2xl font-semibold">Edit {caregiver.name}</h1>
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

      <Card>
        <CardHeader>
          <CardTitle>Login &amp; security</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <SetLoginForm caregiverId={caregiver.id} currentEmail={caregiver.email} />

          {isSelf && caregiver.passwordHash && (
            <div className="flex flex-col gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
              <Label className="mb-0">Face ID &amp; passkeys</Label>
              {caregiver.credentials.length > 0 && (
                <ul className="flex flex-col gap-2">
                  {caregiver.credentials.map((cred) => (
                    <li
                      key={cred.id}
                      className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800"
                    >
                      <span className="flex items-center gap-2">
                        <ScanFace className="h-4 w-4 text-teal-600" />
                        {cred.deviceLabel ?? "Passkey"}
                      </span>
                      <form action={deleteCredential}>
                        <input type="hidden" name="id" value={cred.id} />
                        <button
                          type="submit"
                          className="text-zinc-400 hover:text-red-600"
                          aria-label="Remove"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </form>
                    </li>
                  ))}
                </ul>
              )}
              <FaceIdEnroll />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
