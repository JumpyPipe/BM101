import { NextResponse } from "next/server";
import { handleRoute, jsonError } from "@/lib/api-helpers";
import { refreshPredictions } from "@/lib/predictions";
import { requireApiHousehold } from "@/lib/auth/api-auth";
import { isHouseholdBaby } from "@/lib/household";

export async function GET(req: Request) {
  return handleRoute(async () => {
    const { caregiverId } = await requireApiHousehold(req);
    const babyId = new URL(req.url).searchParams.get("babyId");
    if (!babyId) return jsonError("babyId query param is required");
    if (!(await isHouseholdBaby(caregiverId, babyId))) return jsonError("Baby not found", 404);
    const { feeding, sleep } = await refreshPredictions(babyId);
    return NextResponse.json({ feeding, sleep });
  });
}
