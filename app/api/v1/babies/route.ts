import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handleRoute } from "@/lib/api-helpers";

const createSchema = z.object({
  name: z.string().min(1),
  dob: z.string().min(1),
  sex: z.enum(["MALE", "FEMALE", "UNKNOWN"]).default("UNKNOWN"),
  notes: z.string().optional(),
});

export async function GET() {
  return handleRoute(async () => {
    const babies = await prisma.baby.findMany({ orderBy: { createdAt: "asc" } });
    return NextResponse.json({ babies });
  });
}

export async function POST(req: Request) {
  return handleRoute(async () => {
    const body = createSchema.parse(await req.json());
    const baby = await prisma.baby.create({
      data: { ...body, dob: new Date(body.dob) },
    });
    return NextResponse.json({ baby }, { status: 201 });
  });
}
