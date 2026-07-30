import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleRoute, jsonError } from "@/lib/api-helpers";

const createSchema = z.object({
  babyId: z.string().min(1),
  type: z.enum(["NAP", "NIGHT"]),
  startedAt: z.string().min(1),
  endedAt: z.string().optional(),
  note: z.string().optional(),
});

export async function GET(req: Request) {
  return handleRoute(async () => {
    const babyId = new URL(req.url).searchParams.get("babyId");
    if (!babyId) return jsonError("babyId query param is required");
    const take = Number(new URL(req.url).searchParams.get("take") ?? 50);
    const logs = await prisma.sleepLog.findMany({
      where: { babyId },
      orderBy: { startedAt: "desc" },
      take: Math.min(take, 200),
    });
    return NextResponse.json({ logs });
  });
}

export async function POST(req: Request) {
  return handleRoute(async () => {
    const body = createSchema.parse(await req.json());
    const log = await prisma.sleepLog.create({
      data: {
        ...body,
        startedAt: new Date(body.startedAt),
        endedAt: body.endedAt ? new Date(body.endedAt) : null,
      },
    });
    return NextResponse.json({ log }, { status: 201 });
  });
}
