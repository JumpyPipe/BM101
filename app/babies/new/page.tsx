import Link from "next/link";
import { createBaby } from "@/lib/actions/babies";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";

export default function NewBabyPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Add a baby</h1>
      <Card>
        <CardHeader>
          <CardTitle>Baby profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createBaby} className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
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
            <div className="col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" name="notes" rows={3} placeholder="Allergies, preferences, etc. (optional)" />
            </div>
            <div className="col-span-2 flex gap-2">
              <SubmitButton>Save baby</SubmitButton>
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
