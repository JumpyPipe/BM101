import { NextResponse } from "next/server";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { verifySession } from "@/lib/auth/current-caregiver";
import { prisma } from "@/lib/db";
import { getAndClearChallenge, getRpId, getOrigin } from "@/lib/auth/webauthn";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  let caregiverId: string;
  try {
    caregiverId = await verifySession();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const deviceLabel = typeof body.deviceLabel === "string" ? body.deviceLabel : "Face ID / Passkey";

  const expectedChallenge = await getAndClearChallenge();
  if (!expectedChallenge) {
    return NextResponse.json({ error: "That setup attempt expired. Try again." }, { status: 400 });
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: getOrigin(req),
      expectedRPID: getRpId(req),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Verification failed" },
      { status: 400 },
    );
  }

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  const { credential } = verification.registrationInfo;
  await prisma.webAuthnCredential.create({
    data: {
      caregiverId,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey),
      counter: credential.counter,
      deviceLabel,
    },
  });

  revalidatePath("/caregivers/[id]/edit", "page");
  return NextResponse.json({ success: true });
}
