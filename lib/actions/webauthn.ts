"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { verifySession } from "@/lib/auth/current-caregiver";

export async function deleteCredential(formData: FormData) {
  const caregiverId = await verifySession();
  const credentialId = formData.get("id") as string;

  await prisma.webAuthnCredential.deleteMany({
    where: { id: credentialId, caregiverId },
  });

  revalidatePath("/caregivers/[id]/edit", "page");
}
