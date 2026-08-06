import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleRoute, jsonError } from "@/lib/api-helpers";
import { getDueTips } from "@/lib/tips";
import { requireApiCaregiver } from "@/lib/auth/api-auth";

export async function GET(req: Request) {
  return handleRoute(async () => {
    await requireApiCaregiver(req);
    const babyId = new URL(req.url).searchParams.get("babyId");
    if (!babyId) return jsonError("babyId query param is required");
    const tips = await getDueTips(babyId);
    return NextResponse.json({ tips });
  });
}

const feedbackSchema = z.object({
  tipId: z.string().min(1),
  action: z.enum(["dismiss", "useful", "not_useful"]),
});

export async function POST(req: Request) {
  return handleRoute(async () => {
    await requireApiCaregiver(req);
    const { tipId, action } = feedbackSchema.parse(await req.json());
    const tip = await prisma.tip.update({
      where: { id: tipId },
      data:
        action === "dismiss"
          ? { dismissed: true }
          : { usefulFeedback: action === "useful" },
    });
    return NextResponse.json({ tip });
  });
}
