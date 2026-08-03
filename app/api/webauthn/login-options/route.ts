import { NextResponse } from "next/server";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { setChallenge, getRpId } from "@/lib/auth/webauthn";

/** Public, usernameless: the platform authenticator (Face ID) picks from any discoverable credential. */
export async function POST(req: Request) {
  const options = await generateAuthenticationOptions({
    rpID: getRpId(req),
    userVerification: "required",
  });

  await setChallenge(options.challenge);
  return NextResponse.json(options);
}
