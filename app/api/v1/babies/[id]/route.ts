import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleRoute, jsonError } from "@/lib/api-helpers";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  dob: z.string().min(1).optional(),
  sex: z.enum(["MALE", "FEMALE", "UNKNOWN"]).optional(),
  notes: z.string().nullable().optional(),
});

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const { id } = await params;
    const baby = await prisma.baby.findUnique({ where: { id } });
    if (!baby) return jsonError("Baby not found", 404);
    return NextResponse.json({ baby });
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const { id } = await params;
    const body = updateSchema.parse(await req.json());
    const baby = await prisma.baby.update({
      where: { id },
      data: { ...body, dob: body.dob ? new Date(body.dob) : undefined },
    });
    return NextResponse.json({ baby });
  });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const { id } = await params;
    await prisma.baby.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  });
}
