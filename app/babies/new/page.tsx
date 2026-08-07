import Link from "next/link";
import { Sparkles } from "lucide-react";
import { createBaby } from "@/lib/actions/babies";
import { createCaregiverOnboarding } from "@/lib/actions/caregivers";
import { prisma } from "@/lib/db";
import { requireCurrentHousehold, isHouseholdBaby } from "@/lib/household";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";

export default async function NewBabyPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; babyId?: string }>;
}) {
  const { step, babyId } = await searchParams;

  if (step === "caregiver" && babyId) {
    const { caregiverId } = await requireCurrentHousehold();
    if (await isHouseholdBaby(caregiverId, babyId)) {
      const baby = await prisma.baby.findUnique({ where: { id: babyId } });
      if (baby) {
        return <CaregiverStep babyName={baby.name} />;
      }
    }
  }

  return <ProfileStep />;
}

function StepIndicator({ current }: { current: 1 | 2 }) {
  return (
    <div className="flex items-center gap-2 text-xs font-medium">
      <span className={current === 1 ? "text-teal-600" : "text-zinc-400"}>1. Baby profile</span>
      <span className="text-zinc-300">—</span>
      <span className={current === 2 ? "text-teal-600" : "text-zinc-400"}>2. Caregivers (optional)</span>
    </div>
  );
}

function ProfileStep() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
      <StepIndicator current={1} />
      <h1 className="font-fredoka text-2xl font-semibold">Add a baby</h1>
      <Card>
        <CardHeader>
          <CardTitle>Baby profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createBaby} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="dob">Date of birth</Label>
              <Input id="dob" name="dob" type="date" required />
            </div>
            <div>
              <Label htmlFor="sex">Sex</Label>
              <Select id="sex" name="sex" defaultValue="UNKNOWN">
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
                <option value="UNKNOWN">Prefer not to say</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Allergies, preferences, etc. (optional)"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <SubmitButton>Continue</SubmitButton>
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

function CaregiverStep({ babyName }: { babyName: string }) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
      <StepIndicator current={2} />
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-teal-500" />
        <h1 className="font-fredoka text-2xl font-semibold">{babyName} is all set!</h1>
      </div>
      <p className="text-sm text-zinc-500">
        Want to add another caregiver — a partner, grandparent, or nanny — who&apos;ll also log for{" "}
        {babyName}? This is entirely optional; you can always add one later from Babies &amp;
        Caregivers.
      </p>
      <Card>
        <CardHeader>
          <CardTitle>Add a caregiver (optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCaregiverOnboarding} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Input id="role" name="role" defaultValue="Parent" required />
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <SubmitButton>Add caregiver &amp; finish</SubmitButton>
              <Link href="/">
                <Button type="button" variant="outline">
                  Skip for now
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
