import Link from "next/link";
import { prisma } from "@/lib/db";
import { getSessionCaregiverId } from "@/lib/auth/session";
import { isHouseholdMember } from "@/lib/household";
import { acceptInvite } from "@/lib/actions/invites";
import { SnugMark } from "@/components/ui/snug-mark";
import { Button } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const [invite, caregiverId] = await Promise.all([
    prisma.householdInvite.findUnique({ where: { token }, include: { household: true } }),
    getSessionCaregiverId(),
  ]);

  const expired = !!invite?.expiresAt && invite.expiresAt < new Date();
  const invalid = !invite || !!invite.usedAt || expired;

  // Checked independent of `invalid` — a used-up invite is exactly what an
  // already-accepted membership looks like, and someone revisiting their
  // own accepted link should see "you're already in", not "invalid link".
  const alreadyMember =
    invite && caregiverId ? await isHouseholdMember(invite.householdId, caregiverId) : false;

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
      <SnugMark className="h-10 w-10 text-teal-600" />

      {alreadyMember && invite ? (
        <>
          <h1 className="font-fredoka text-2xl font-semibold">You&rsquo;re already in</h1>
          <p className="text-sm text-zinc-500">
            You&rsquo;re already a member of {invite.household.name}.
          </p>
          <Link href="/" className="font-medium text-teal-600 hover:underline">
            Go to Snug
          </Link>
        </>
      ) : invalid || !invite ? (
        <>
          <h1 className="font-fredoka text-2xl font-semibold">Invite not available</h1>
          <p className="text-sm text-zinc-500">
            This invite link is invalid, has already been used, or has expired. Ask whoever sent it
            for a new one.
          </p>
          <Link href="/" className="font-medium text-teal-600 hover:underline">
            Go to Snug
          </Link>
        </>
      ) : !caregiverId ? (
        <>
          <h1 className="font-fredoka text-2xl font-semibold">Join {invite.household.name}</h1>
          <p className="text-sm text-zinc-500">
            Sign in or create a free account to accept this invite.
          </p>
          <div className="flex w-full flex-col gap-2">
            <Link href={`/signup?next=${encodeURIComponent(`/invite/${token}`)}`}>
              <Button className="w-full" size="lg">
                Create account
              </Button>
            </Link>
            <Link href={`/login?next=${encodeURIComponent(`/invite/${token}`)}`}>
              <Button className="w-full" size="lg" variant="outline">
                Sign in
              </Button>
            </Link>
          </div>
        </>
      ) : (
        <>
          <h1 className="font-fredoka text-2xl font-semibold">Join {invite.household.name}</h1>
          <p className="text-sm text-zinc-500">
            You&rsquo;ve been invited to join as a {invite.role === "OWNER" ? "co-owner" : "caregiver"}.
            You&rsquo;ll be able to log and see everything for their babies.
          </p>
          <form action={acceptInvite.bind(null, token)} className="w-full">
            <SubmitButton className="w-full" size="lg">
              Accept invite
            </SubmitButton>
          </form>
        </>
      )}
    </div>
  );
}
