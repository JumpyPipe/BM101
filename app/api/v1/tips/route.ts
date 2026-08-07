import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleRoute, jsonError } from "@/lib/api-helpers";
import { getDueTips } from "@/lib/tips";
import { requireApiHousehold } from "@/lib/auth/api-auth";
import { isHouseholdBaby } from "@/lib/household";

export async function GET(req: Request) {
  return handleRoute(async () => {
    const { caregiverId } = await requireApiHousehold(req);
    const babyId = new URL(req.url).searchParams.get("babyId");
    if (!babyId) return jsonError("babyId query param is required");
    if (!(await isHouseholdBaby(caregiverId, babyId))) return jsonError("Baby not found", 404);
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
    const { caregiverId } = await requireApiHousehold(req);
    const { tipId, action } = feedbackSchema.parse(await req.json());
    const existing = await prisma.tip.findUnique({ where: { id: tipId }, select: { babyId: true } });
    if (!existing || !(await isHouseholdBaby(caregiverId, existing.babyId))) {
      return jsonError("Tip not found", 404);
    }
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
