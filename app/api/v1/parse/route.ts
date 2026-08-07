import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleRoute, jsonError } from "@/lib/api-helpers";
import { getAnthropicClient, CLAUDE_MODEL } from "@/lib/ai";
import { requireApiHousehold } from "@/lib/auth/api-auth";
import { isHouseholdBaby } from "@/lib/household";
import type Anthropic from "@anthropic-ai/sdk";

const requestSchema = z.object({
  babyId: z.string().min(1),
  text: z.string().min(1).max(1000),
});

const logEventTool: Anthropic.Tool = {
  name: "log_event",
  description:
    "Log a single structured caregiving event extracted from the caregiver's natural-language note.",
  input_schema: {
    type: "object",
    properties: {
      type: {
        type: "string",
        enum: ["FEEDING", "SLEEP", "DIAPER", "GROWTH", "MILESTONE"],
      },
      time: {
        type: "string",
        description:
          "ISO 8601 datetime the event happened/started. Resolve relative phrases ('just now', '20 min ago') against the current time given in the system prompt.",
      },
      feedingType: { type: "string", enum: ["BREAST", "BOTTLE", "SOLID"] },
      side: { type: "string", enum: ["LEFT", "RIGHT", "BOTH"] },
      amountMl: { type: "number" },
      durationMin: { type: "number" },
      sleepType: { type: "string", enum: ["NAP", "NIGHT"] },
      diaperType: { type: "string", enum: ["WET", "DIRTY", "MIXED"] },
      weightKg: { type: "number" },
      heightCm: { type: "number" },
      headCm: { type: "number" },
      milestoneCategory: { type: "string" },
      title: { type: "string", description: "Milestone title, e.g. 'First smile'" },
      note: { type: "string" },
    },
    required: ["type", "time"],
  },
};

export async function POST(req: Request) {
  return handleRoute(async () => {
    const { caregiverId } = await requireApiHousehold(req);
    const { babyId, text } = requestSchema.parse(await req.json());
    if (!(await isHouseholdBaby(caregiverId, babyId))) return jsonError("Baby not found", 404);

    let anthropic;
    try {
      anthropic = getAnthropicClient();
    } catch (e) {
      return jsonError(e instanceof Error ? e.message : "AI is not configured", 503);
    }

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      tools: [logEventTool],
      system:
        `Current time: ${new Date().toISOString()}. You extract structured caregiving log ` +
        "entries from short notes a parent dictates or types (e.g. 'fed 4oz bottle 10 min ago', " +
        "'she just woke up', 'wet diaper'). If the note describes a loggable event, call log_event " +
        "with your best structured interpretation. If it's a question, unclear, or not a loggable " +
        "event, reply with plain text asking a brief clarifying question instead of calling the tool.",
      messages: [{ role: "user", content: text }],
    });

    if (response.stop_reason === "refusal") {
      return jsonError("The assistant declined to process this note", 502);
    }

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      const textBlock = response.content.find((b) => b.type === "text");
      return NextResponse.json({
        logged: false,
        clarification: textBlock && textBlock.type === "text" ? textBlock.text : "Could not understand that note.",
      });
    }

    const input = toolUse.input as {
      type: "FEEDING" | "SLEEP" | "DIAPER" | "GROWTH" | "MILESTONE";
      time: string;
      feedingType?: "BREAST" | "BOTTLE" | "SOLID";
      side?: "LEFT" | "RIGHT" | "BOTH";
      amountMl?: number;
      durationMin?: number;
      sleepType?: "NAP" | "NIGHT";
      diaperType?: "WET" | "DIRTY" | "MIXED";
      weightKg?: number;
      heightCm?: number;
      headCm?: number;
      milestoneCategory?: string;
      title?: string;
      note?: string;
    };

    const time = new Date(input.time);

    switch (input.type) {
      case "FEEDING": {
        const log = await prisma.feedingLog.create({
          data: {
            babyId,
            type: input.feedingType ?? "BOTTLE",
            side: input.side,
            amountMl: input.amountMl,
            durationMin: input.durationMin,
            startedAt: time,
            note: input.note,
          },
        });
        return NextResponse.json({ logged: true, kind: "feeding", log });
      }
      case "SLEEP": {
        const log = await prisma.sleepLog.create({
          data: {
            babyId,
            type: input.sleepType ?? "NAP",
            startedAt: time,
            note: input.note,
          },
        });
        return NextResponse.json({ logged: true, kind: "sleep", log });
      }
      case "DIAPER": {
        const log = await prisma.diaperLog.create({
          data: {
            babyId,
            type: input.diaperType ?? "WET",
            occurredAt: time,
            note: input.note,
          },
        });
        return NextResponse.json({ logged: true, kind: "diaper", log });
      }
      case "GROWTH": {
        const log = await prisma.growthLog.create({
          data: {
            babyId,
            measuredAt: time,
            weightKg: input.weightKg,
            heightCm: input.heightCm,
            headCm: input.headCm,
            note: input.note,
          },
        });
        return NextResponse.json({ logged: true, kind: "growth", log });
      }
      case "MILESTONE": {
        const milestone = await prisma.milestone.create({
          data: {
            babyId,
            occurredAt: time,
            category: input.milestoneCategory ?? "Other",
            title: input.title ?? text.slice(0, 80),
            description: input.note,
          },
        });
        return NextResponse.json({ logged: true, kind: "milestone", milestone });
      }
    }
  });
}
