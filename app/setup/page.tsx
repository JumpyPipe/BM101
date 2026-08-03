import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { anyCaregiverHasLogin } from "@/lib/auth/current-caregiver";
import { ClaimForm } from "@/components/auth/claim-form";
import { SnugMark } from "@/components/ui/snug-mark";

export default async function SetupPage() {
  if (await anyCaregiverHasLogin()) {
    redirect("/login");
  }

  const caregivers = await prisma.caregiver.findMany({
    where: { passwordHash: null },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <SnugMark className="h-10 w-10 text-teal-600" />
        <h1 className="font-fredoka text-2xl font-semibold text-teal-700 dark:text-teal-400">
          Set up your login
        </h1>
        <p className="text-sm text-zinc-500">
          One-time step: pick who you are, then set an email and password to secure your Snug
          account. Everyone else can claim their own login the same way, or add Face ID afterward.
        </p>
      </div>
      {caregivers.length === 0 ? (
        <p className="text-center text-sm text-zinc-500">
          No caregivers found to claim. Add a caregiver from the app first, then come back here.
        </p>
      ) : (
        <ClaimForm caregivers={caregivers} />
      )}
    </div>
  );
}
