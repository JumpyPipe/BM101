import { NextResponse, type NextRequest } from "next/server";
import { verifySessionToken } from "@/lib/auth/session";

const SESSION_COOKIE_NAME = "snug_session";

function isPublicPath(pathname: string): boolean {
  if (pathname === "/login" || pathname === "/signup" || pathname === "/setup") return true;
  // Invite links are followed by signed-out visitors — the page itself
  // prompts them to sign in/up (with `next` pointing back here) before
  // actually accepting.
  if (pathname.startsWith("/invite/")) return true;
  if (pathname === "/manifest.webmanifest" || pathname === "/icon.png") return true;
  if (pathname.startsWith("/api/v1/")) return true;
  if (pathname.startsWith("/api/auth/")) return true;
  if (pathname === "/api/webauthn/login-options" || pathname === "/api/webauthn/login-verify") {
    return true;
  }
  return false;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const caregiverId = token ? await verifySessionToken(token) : null;

  if (!caregiverId) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/).*)"],
};
