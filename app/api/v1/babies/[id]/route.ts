import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleRoute, jsonError } from "@/lib/api-helpers";
import { requireApiHousehold } from "@/lib/auth/api-auth";
import { isHouseholdBaby } from "@/lib/household";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  dob: z.string().min(1).optional(),
  sex: z.enum(["MALE", "FEMALE", "UNKNOWN"]).optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const { caregiverId } = await requireApiHousehold(req);
    const { id } = await params;
    if (!(await isHouseholdBaby(caregiverId, id))) return jsonError("Baby not found", 404);
    const baby = await prisma.baby.findUnique({ where: { id } });
    if (!baby) return jsonError("Baby not found", 404);
    return NextResponse.json({ baby });
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const { caregiverId } = await requireApiHousehold(req);
    const { id } = await params;
    if (!(await isHouseholdBaby(caregiverId, id))) return jsonError("Baby not found", 404);
    const body = updateSchema.parse(await req.json());
    const baby = await prisma.baby.update({
      where: { id },
      data: { ...body, dob: body.dob ? new Date(body.dob) : undefined },
    });
    return NextResponse.json({ baby });
  });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const { caregiverId } = await requireApiHousehold(req);
    const { id } = await params;
    if (!(await isHouseholdBaby(caregiverId, id))) return jsonError("Baby not found", 404);
    await prisma.baby.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  });
}
