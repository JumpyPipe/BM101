import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleRoute, jsonError } from "@/lib/api-helpers";
import { requireApiHousehold } from "@/lib/auth/api-auth";
import { isHouseholdBaby } from "@/lib/household";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const { caregiverId } = await requireApiHousehold(req);
    const { id } = await params;
    const existing = await prisma.sleepLog.findUnique({ where: { id }, select: { babyId: true } });
    if (!existing || !(await isHouseholdBaby(caregiverId, existing.babyId))) {
      return jsonError("Sleep log not found", 404);
    }
    const log = await prisma.sleepLog.update({
      where: { id },
      data: { endedAt: new Date() },
    });
    return NextResponse.json({ log });
  });
}
