import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleRoute, jsonError } from "@/lib/api-helpers";
import { requireApiCaregiver } from "@/lib/auth/api-auth";

const createSchema = z.object({
  babyId: z.string().min(1),
  measuredAt: z.string().min(1),
  weightKg: z.number().positive().optional(),
  heightCm: z.number().positive().optional(),
  headCm: z.number().positive().optional(),
  note: z.string().optional(),
});

export async function GET(req: Request) {
  return handleRoute(async () => {
    await requireApiCaregiver(req);
    const babyId = new URL(req.url).searchParams.get("babyId");
    if (!babyId) return jsonError("babyId query param is required");
    const logs = await prisma.growthLog.findMany({
      where: { babyId },
      orderBy: { measuredAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ logs });
  });
}

export async function POST(req: Request) {
  return handleRoute(async () => {
    await requireApiCaregiver(req);
    const body = createSchema.parse(await req.json());
    const log = await prisma.growthLog.create({
      data: { ...body, measuredAt: new Date(body.measuredAt) },
    });
    return NextResponse.json({ log }, { status: 201 });
  });
}
