import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleRoute, jsonError } from "@/lib/api-helpers";

const createSchema = z.object({
  babyId: z.string().min(1),
  occurredAt: z.string().min(1),
  category: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
});

export async function GET(req: Request) {
  return handleRoute(async () => {
    const babyId = new URL(req.url).searchParams.get("babyId");
    if (!babyId) return jsonError("babyId query param is required");
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
    const body = createSchema.parse(await req.json());
    const milestone = await prisma.milestone.create({
      data: { ...body, occurredAt: new Date(body.occurredAt) },
    });
    return NextResponse.json({ milestone }, { status: 201 });
  });
}
