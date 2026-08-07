import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireCurrentHousehold, requireHouseholdOwner } from "@/lib/household";
import { getSiteUrl } from "@/lib/site-url";
import { revokeInvite } from "@/lib/actions/invites";
import { formatDate } from "@/lib/format";
import { CreateInviteForm } from "@/components/auth/create-invite-form";
import { CopyLinkButton } from "@/components/auth/copy-link-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DeleteButton } from "@/components/trackers/delete-button";

export default async function InviteManagementPage() {
  const { caregiverId, household } = await requireCurrentHousehold();

  let isOwner = true;
  try {
    await requireHouseholdOwner(caregiverId, household.id);
  } catch {
    isOwner = false;
  }

  const [invites, siteUrl] = await Promise.all([
    isOwner
      ? prisma.householdInvite.findMany({
          where: { householdId: household.id, usedAt: null },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    getSiteUrl(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-fredoka text-2xl font-semibold">Invite to {household.name}</h1>
        <p className="text-sm text-zinc-500">
          Anyone with an invite link can join and see everything for your babies. Only share it
          with people you trust.
        </p>
      </div>

      {!isOwner ? (
        <p className="text-sm text-zinc-500">
          Only a household owner can create invite links. Ask an owner in {household.name} to send
          you one.
        </p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>New invite link</CardTitle>
            </CardHeader>
            <CardContent>
              <CreateInviteForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active links</CardTitle>
            </CardHeader>
            <CardContent>
              {invites.length === 0 ? (
                <p className="text-sm text-zinc-500">No active invite links yet.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800">
                  {invites.map((invite) => {
                    const expired = !!invite.expiresAt && invite.expiresAt < new Date();
                    const url = `${siteUrl}/invite/${invite.token}`;
                    return (
                      <li key={invite.id} className="flex flex-col gap-2 py-3">
                        <div className="flex items-center gap-2">
                          <Badge variant={invite.role === "OWNER" ? "violet" : "teal"}>
                            {invite.role === "OWNER" ? "Co-owner" : "Caregiver"}
                          </Badge>
                          <span className="ml-auto text-xs text-zinc-400">
                            {expired
                              ? "Expired"
                              : invite.expiresAt
                                ? `Expires ${formatDate(invite.expiresAt)}`
                                : null}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 truncate rounded-lg bg-zinc-100 px-2 py-1.5 text-xs dark:bg-zinc-800">
                            {url}
                          </code>
                          {!expired && <CopyLinkButton url={url} />}
                          <form action={revokeInvite.bind(null, invite.id)}>
                            <DeleteButton confirmLabel="Revoke this invite link?" ariaLabel="Revoke invite" />
                          </form>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <Link href="/babies" className="text-sm font-medium text-teal-600 hover:underline">
        ← Back to Babies
      </Link>
    </div>
  );
}
