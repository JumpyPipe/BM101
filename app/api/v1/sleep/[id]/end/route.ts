import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleRoute } from "@/lib/api-helpers";
import { requireApiCaregiver } from "@/lib/auth/api-auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    await requireApiCaregiver(req);
    const { id } = await params;
    const log = await prisma.sleepLog.update({
      where: { id },
      data: { endedAt: new Date() },
    });
    return NextResponse.json({ log });
  });
}
