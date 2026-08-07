import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleRoute, jsonError } from "@/lib/api-helpers";
import { requireApiHousehold } from "@/lib/auth/api-auth";
import { isHouseholdBaby } from "@/lib/household";

const createSchema = z.object({
  babyId: z.string().min(1),
  type: z.enum(["BREAST", "BOTTLE", "SOLID"]),
  side: z.enum(["LEFT", "RIGHT", "BOTH"]).optional(),
  amountMl: z.number().positive().optional(),
  durationMin: z.number().positive().optional(),
  startedAt: z.string().min(1),
  note: z.string().optional(),
});

export async function GET(req: Request) {
  return handleRoute(async () => {
    const { caregiverId } = await requireApiHousehold(req);
    const babyId = new URL(req.url).searchParams.get("babyId");
    if (!babyId) return jsonError("babyId query param is required");
    if (!(await isHouseholdBaby(caregiverId, babyId))) return jsonError("Baby not found", 404);
    const take = Number(new URL(req.url).searchParams.get("take") ?? 50);
    const logs = await prisma.feedingLog.findMany({
      where: { babyId },
      orderBy: { startedAt: "desc" },
      take: Math.min(take, 200),
    });
    return NextResponse.json({ logs });
  });
}

export async function POST(req: Request) {
  return handleRoute(async () => {
    const { caregiverId } = await requireApiHousehold(req);
    const body = createSchema.parse(await req.json());
    if (!(await isHouseholdBaby(caregiverId, body.babyId))) return jsonError("Baby not found", 404);
    const log = await prisma.feedingLog.create({
      data: { ...body, startedAt: new Date(body.startedAt) },
    });
    return NextResponse.json({ log }, { status: 201 });
  });
}
