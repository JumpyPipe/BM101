import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleRoute, jsonError } from "@/lib/api-helpers";
import { getAnthropicClient, summarizeBabyContext, CLAUDE_MODEL } from "@/lib/ai";
import { requireApiCaregiver } from "@/lib/auth/api-auth";

const requestSchema = z.object({
  babyId: z.string().min(1),
  message: z.string().min(1).max(4000),
});

export async function POST(req: Request) {
  return handleRoute(async () => {
    await requireApiCaregiver(req);
    const { babyId, message } = requestSchema.parse(await req.json());

    let anthropic;
    try {
      anthropic = getAnthropicClient();
    } catch (e) {
      return jsonError(e instanceof Error ? e.message : "AI is not configured", 503);
    }

    const [context, history] = await Promise.all([
      summarizeBabyContext(babyId),
      prisma.chatMessage.findMany({
        where: { babyId },
        orderBy: { createdAt: "asc" },
        take: 20,
      }),
    ]);

    await prisma.chatMessage.create({ data: { babyId, role: "USER", content: message } });

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1536,
      system:
        "You are a warm, practical parenting assistant inside a baby-tracking app. You can see the " +
        "baby's recently logged feeding, sleep, diaper, growth, and milestone data below — use it to " +
        "ground your answers when relevant. Keep answers concise (this is a mobile chat UI). You are " +
        "not a doctor: for anything medical or urgent, clearly recommend contacting a pediatrician " +
        "rather than diagnosing.\n\n=== Baby data ===\n" +
        context,
      messages: [
        ...history.map((m) => ({
          role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
          content: m.content,
        })),
        { role: "user" as const, content: message },
      ],
    });

    if (response.stop_reason === "refusal") {
      return jsonError("The assistant declined to respond", 502);
    }

    const textBlock = response.content.find((b) => b.type === "text");
    const reply = textBlock && textBlock.type === "text" ? textBlock.text : "";

    if (reply.trim().length > 0) {
      await prisma.chatMessage.create({ data: { babyId, role: "ASSISTANT", content: reply } });
    }

    return NextResponse.json({ reply });
  });
}
