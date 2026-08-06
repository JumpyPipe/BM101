import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleRoute } from "@/lib/api-helpers";
import { requireApiCaregiver } from "@/lib/auth/api-auth";

const createSchema = z.object({
  name: z.string().min(1),
  role: z.string().min(1).default("Parent"),
});

// Never serialize email/passwordHash into API responses — this is the only
// caregiver-listing endpoint on the iOS client's surface, and the iOS
// Caregiver model doesn't need or expect login fields.
const publicSelect = { id: true, name: true, role: true, createdAt: true, updatedAt: true } as const;

export async function GET(req: Request) {
  return handleRoute(async () => {
    await requireApiCaregiver(req);
    const caregivers = await prisma.caregiver.findMany({
      orderBy: { createdAt: "asc" },
      select: publicSelect,
    });
    return NextResponse.json({ caregivers });
  });
}

export async function POST(req: Request) {
  return handleRoute(async () => {
    await requireApiCaregiver(req);
    const body = createSchema.parse(await req.json());
    const caregiver = await prisma.caregiver.create({ data: body, select: publicSelect });
    return NextResponse.json({ caregiver }, { status: 201 });
  });
}
