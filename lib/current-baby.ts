import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

const COOKIE_NAME = "bm101_current_baby";

export async function getAllBabies() {
  return prisma.baby.findMany({ orderBy: { createdAt: "asc" } });
}

/** Returns the caregiver's currently selected baby, falling back to the first baby on record. */
export async function getCurrentBaby() {
  const babies = await getAllBabies();
  if (babies.length === 0) return { babies, current: null };

  const cookieStore = await cookies();
  const selectedId = cookieStore.get(COOKIE_NAME)?.value;
  const current = babies.find((b) => b.id === selectedId) ?? babies[0];

  return { babies, current };
}

export async function setCurrentBabyCookie(babyId: string) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, babyId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}
