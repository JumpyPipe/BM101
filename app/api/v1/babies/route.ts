import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleRoute } from "@/lib/api-helpers";
import { requireApiHousehold } from "@/lib/auth/api-auth";

const createSchema = z.object({
  name: z.string().min(1),
  dob: z.string().min(1),
  sex: z.enum(["MALE", "FEMALE", "UNKNOWN"]).default("UNKNOWN"),
  notes: z.string().optional(),
});

export async function GET(req: Request) {
  return handleRoute(async () => {
    const { householdId } = await requireApiHousehold(req);
    const babies = await prisma.baby.findMany({ where: { householdId }, orderBy: { createdAt: "asc" } });
    return NextResponse.json({ babies });
  });
}

export async function POST(req: Request) {
  return handleRoute(async () => {
    const { householdId } = await requireApiHousehold(req);
    const body = createSchema.parse(await req.json());
    const baby = await prisma.baby.create({
      data: { ...body, dob: new Date(body.dob), householdId },
    });
    return NextResponse.json({ baby }, { status: 201 });
  });
}
