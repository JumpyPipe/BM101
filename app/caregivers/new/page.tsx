import Link from "next/link";
import { createCaregiver } from "@/lib/actions/caregivers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";

export default function NewCaregiverPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Add a caregiver</h1>
      <Card>
        <CardHeader>
          <CardTitle>Caregiver</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createCaregiver} className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" required />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Input id="role" name="role" defaultValue="Parent" required />
            </div>
            <div className="col-span-2 flex gap-2">
              <SubmitButton>Save caregiver</SubmitButton>
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
