import { NextResponse } from "next/server";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth/session";
import { getAndClearChallenge, getRpId, getOrigin } from "@/lib/auth/webauthn";

export async function POST(req: Request) {
  const body = await req.json();

  const expectedChallenge = await getAndClearChallenge();
  if (!expectedChallenge) {
    return NextResponse.json({ error: "That sign-in attempt expired. Try again." }, { status: 400 });
  }

  const credential = await prisma.webAuthnCredential.findUnique({
    where: { credentialId: body.id },
  });
  if (!credential) {
    return NextResponse.json({ error: "That passkey isn't registered here." }, { status: 400 });
  }

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge,
      expectedOrigin: getOrigin(req),
      expectedRPID: getRpId(req),
      credential: {
        id: credential.credentialId,
        publicKey: new Uint8Array(credential.publicKey),
        counter: credential.counter,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Verification failed" },
      { status: 400 },
    );
  }

  if (!verification.verified) {
    return NextResponse.json({ error: "Verification failed" }, { status: 400 });
  }

  await prisma.webAuthnCredential.update({
    where: { id: credential.id },
    data: { counter: verification.authenticationInfo.newCounter },
  });

  await createSession(credential.caregiverId);
  return NextResponse.json({ success: true });
}
