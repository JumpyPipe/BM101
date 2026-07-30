import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleRoute } from "@/lib/api-helpers";

const createSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1).default("Parent"),
});

export async function GET() {
  return handleRoute(async () => {
    const caregivers = await prisma.caregiver.findMany({ orderBy: { createdAt: "asc" } });
    return NextResponse.json({ caregivers });
  });
}

export async function POST(req: Request) {
  return handleRoute(async () => {
    const body = createSchema.parse(await req.json());
    const caregiver = await prisma.caregiver.create({ data: body });
    return NextResponse.json({ caregiver }, { status: 201 });
  });
}
