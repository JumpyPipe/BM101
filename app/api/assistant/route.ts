import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAnthropicClient, summarizeBabyContext, CLAUDE_MODEL } from "@/lib/ai";
import { verifySession } from "@/lib/auth/current-caregiver";

const requestSchema = z.object({
  babyId: z.string().min(1),
  message: z.string().min(1).max(4000),
});

export async function POST(req: Request) {
  try {
    await verifySession();
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: { babyId: string; message: string };
  try {
    body = requestSchema.parse(await req.json());
  } catch {
    return new Response("Invalid request body", { status: 400 });
  }

  let anthropic;
  try {
    anthropic = getAnthropicClient();
  } catch (e) {
    return new Response(e instanceof Error ? e.message : "AI is not configured", { status: 503 });
  }

  const { babyId, message } = body;

  const [context, history] = await Promise.all([
    summarizeBabyContext(babyId),
    prisma.chatMessage.findMany({
      where: { babyId },
      orderBy: { createdAt: "asc" },
      take: 20,
    }),
  ]);

  await prisma.chatMessage.create({ data: { babyId, role: "USER", content: message } });

  const claudeMessages = [
    ...history.map((m) => ({
      role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    })),
    { role: "user" as const, content: message },
  ];

  const stream = anthropic.messages.stream({
    model: CLAUDE_MODEL,
    max_tokens: 1536,
    system:
      "You are a warm, practical parenting assistant inside a baby-tracking app. You can see the baby's " +
      "recently logged feeding, sleep, diaper, growth, and milestone data below — use it to ground your answers " +
      "when relevant, and reference specific numbers/times when it helps. Keep answers concise and actionable. " +
      "You are not a doctor: for anything medical or urgent, clearly recommend contacting a pediatrician rather " +
      "than diagnosing.\n\n=== Baby data ===\n" +
      context,
    messages: claudeMessages,
  });

  const encoder = new TextEncoder();
  let fullText = "";

  const readable = new ReadableStream<Uint8Array>({
    async start(controller) {
      stream.on("text", (delta) => {
        fullText += delta;
        controller.enqueue(encoder.encode(delta));
      });
      stream.on("error", (err) => {
        console.error("Assistant stream error", err);
        controller.error(err);
      });
      try {
        await stream.finalMessage();
      } catch (e) {
        controller.error(e);
        return;
      }
      if (fullText.trim().length > 0) {
        await prisma.chatMessage.create({
          data: { babyId, role: "ASSISTANT", content: fullText },
        });
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
