import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { getAnthropicClient, summarizeBabyContext, CLAUDE_MODEL } from "@/lib/ai";
import { verifySession } from "@/lib/auth/current-caregiver";

const requestSchema = z.object({ babyId: z.string().min(1) });

const insightSchema = {
  type: "object" as const,
  properties: {
    insights: {
      type: "array" as const,
      items: {
        type: "object" as const,
        properties: {
          category: { type: "string" as const, description: "Short topic label, e.g. 'Feeding', 'Sleep', 'Diapers', 'Growth'" },
          severity: { type: "string" as const, enum: ["INFO", "TIP", "ATTENTION"] },
          title: { type: "string" as const },
          body: { type: "string" as const, description: "1-3 sentences, parent-facing, specific to the data given" },
        },
        required: ["category", "severity", "title", "body"],
        additionalProperties: false,
      },
    },
  },
  required: ["insights"],
  additionalProperties: false,
};

export async function POST(req: Request) {
  try {
    await verifySession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let babyId: string;
  try {
    ({ babyId } = requestSchema.parse(await req.json()));
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  let anthropic;
  try {
    anthropic = getAnthropicClient();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "AI is not configured" },
      { status: 503 },
    );
  }

  const context = await summarizeBabyContext(babyId);

  let response;
  try {
    response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: insightSchema },
      },
      system:
        "You are a pediatric-informed parenting assistant reviewing a baby tracking app's logged data. " +
        "Identify concrete, specific patterns worth surfacing to a parent — trends in feeding, sleep, or diapers; " +
        "gaps versus typical ranges for the baby's age; and genuinely useful tips. Ground every insight in the " +
        "data provided; never invent numbers. Return at most 4 insights, ranked by usefulness. If the data is too " +
        "sparse to say anything specific, return an empty insights array rather than generic advice. Use ATTENTION " +
        "severity sparingly and only for things worth a parent's attention soon (never a medical diagnosis — " +
        "always suggest checking with a pediatrician for anything concerning).",
      messages: [{ role: "user", content: context }],
    });
  } catch (e) {
    console.error("Anthropic insights request failed", e);
    return NextResponse.json({ error: "Failed to generate insights" }, { status: 502 });
  }

  if (response.stop_reason === "refusal") {
    return NextResponse.json({ error: "The assistant declined to respond" }, { status: 502 });
  }

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return NextResponse.json({ error: "No response from assistant" }, { status: 502 });
  }

  let parsed: { insights: { category: string; severity: string; title: string; body: string }[] };
  try {
    parsed = JSON.parse(textBlock.text);
  } catch {
    return NextResponse.json({ error: "Could not parse assistant response" }, { status: 502 });
  }

  await prisma.insight.deleteMany({ where: { babyId } });
  if (parsed.insights.length > 0) {
    await prisma.insight.createMany({
      data: parsed.insights.map((i) => ({
        babyId,
        category: i.category,
        severity: i.severity as "INFO" | "TIP" | "ATTENTION",
        title: i.title,
        body: i.body,
      })),
    });
  }

  const insights = await prisma.insight.findMany({
    where: { babyId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ insights });
}
