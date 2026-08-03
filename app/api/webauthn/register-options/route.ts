import { NextResponse } from "next/server";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { verifySession } from "@/lib/auth/current-caregiver";
import { prisma } from "@/lib/db";
import { setChallenge, getRpId } from "@/lib/auth/webauthn";

export async function POST(req: Request) {
  let caregiverId: string;
  try {
    caregiverId = await verifySession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const caregiver = await prisma.caregiver.findUnique({
    where: { id: caregiverId },
    include: { credentials: true },
  });
  if (!caregiver) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const options = await generateRegistrationOptions({
    rpName: "Snug",
    rpID: getRpId(req),
    userID: new TextEncoder().encode(caregiver.id),
    userName: caregiver.email ?? caregiver.name,
    userDisplayName: caregiver.name,
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "required",
      userVerification: "required",
      authenticatorAttachment: "platform",
    },
    excludeCredentials: caregiver.credentials.map((c) => ({ id: c.credentialId })),
  });

  await setChallenge(options.challenge);
  return NextResponse.json(options);
}
