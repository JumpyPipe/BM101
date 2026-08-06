import { NextResponse } from "next/server";
import { handleRoute, jsonError } from "@/lib/api-helpers";
import { refreshPredictions } from "@/lib/predictions";
import { requireApiCaregiver } from "@/lib/auth/api-auth";

export async function GET(req: Request) {
  return handleRoute(async () => {
    await requireApiCaregiver(req);
    const babyId = new URL(req.url).searchParams.get("babyId");
    if (!babyId) return jsonError("babyId query param is required");
    const { feeding, sleep } = await refreshPredictions(babyId);
    return NextResponse.json({ feeding, sleep });
  });
}
