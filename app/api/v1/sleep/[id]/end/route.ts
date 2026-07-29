import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleRoute } from "@/lib/api-helpers";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const { id } = await params;
    const log = await prisma.sleepLog.update({
      where: { id },
      data: { endedAt: new Date() },
    });
    return NextResponse.json({ log });
  });
}
