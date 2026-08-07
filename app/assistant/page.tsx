import { getCurrentBaby } from "@/lib/current-baby";
import { requireCurrentHousehold } from "@/lib/household";
import { prisma } from "@/lib/db";
import { AssistantChat } from "@/components/assistant/chat";
import { EmptyBabyState } from "@/components/dashboard/empty-baby-state";

export default async function AssistantPage() {
  const { household } = await requireCurrentHousehold();
  const { current } = await getCurrentBaby(household.id);
  if (!current) return <EmptyBabyState />;

  const history = await prisma.chatMessage.findMany({
    where: { babyId: current.id },
    orderBy: { createdAt: "asc" },
    take: 50,
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-fredoka text-2xl font-semibold">Assistant</h1>
        <p className="text-sm text-zinc-500">
          Ask Claude about {current.name}&apos;s patterns and get age-aware parenting guidance.
        </p>
      </div>
      <AssistantChat
        babyId={current.id}
        initialMessages={history.map((m) => ({ role: m.role, content: m.content }))}
      />
    </div>
  );
}
