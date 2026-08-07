import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleRoute } from "@/lib/api-helpers";
import { requireApiHousehold } from "@/lib/auth/api-auth";

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
    const { householdId } = await requireApiHousehold(req);
    const memberships = await prisma.householdMembership.findMany({
      where: { householdId },
      orderBy: { createdAt: "asc" },
      select: { caregiver: { select: publicSelect } },
    });
    return NextResponse.json({ caregivers: memberships.map((m) => m.caregiver) });
  });
}

export async function POST(req: Request) {
  return handleRoute(async () => {
    const { householdId } = await requireApiHousehold(req);
    const body = createSchema.parse(await req.json());
    const caregiver = await prisma.caregiver.create({
      data: { ...body, memberships: { create: { householdId, role: "MEMBER" } } },
      select: publicSelect,
    });
    return NextResponse.json({ caregiver }, { status: 201 });
  });
}
