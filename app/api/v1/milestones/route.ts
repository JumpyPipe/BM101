import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleRoute, jsonError } from "@/lib/api-helpers";
import { requireApiHousehold } from "@/lib/auth/api-auth";
import { isHouseholdBaby } from "@/lib/household";

const createSchema = z.object({
  babyId: z.string().min(1),
  occurredAt: z.string().min(1),
  category: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
});

export async function GET(req: Request) {
  return handleRoute(async () => {
    const { caregiverId } = await requireApiHousehold(req);
    const babyId = new URL(req.url).searchParams.get("babyId");
    if (!babyId) return jsonError("babyId query param is required");
    if (!(await isHouseholdBaby(caregiverId, babyId))) return jsonError("Baby not found", 404);
    const milestones = await prisma.milestone.findMany({
      where: { babyId },
      orderBy: { occurredAt: "desc" },
      take: 100,
    });
    return NextResponse.json({ milestones });
  });
}

export async function POST(req: Request) {
  return handleRoute(async () => {
    const { caregiverId } = await requireApiHousehold(req);
    const body = createSchema.parse(await req.json());
    if (!(await isHouseholdBaby(caregiverId, body.babyId))) return jsonError("Baby not found", 404);
    const milestone = await prisma.milestone.create({
      data: { ...body, occurredAt: new Date(body.occurredAt) },
    });
    return NextResponse.json({ milestone }, { status: 201 });
  });
}
