import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { authConfig } from "@/lib/config";
import { verifySessionToken } from "@/lib/jwt-session";

const LOGIN_PATH = "/auth/login";

function buildClearSessionResponse(redirectTo: URL): NextResponse {
  const res = NextResponse.redirect(redirectTo);
  res.cookies.set(authConfig.sessionCookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  const token = request.cookies.get(authConfig.sessionCookieName)?.value;
  const loginUrl = new URL(LOGIN_PATH, request.url);

  if (!token) {
    return NextResponse.redirect(loginUrl);
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return buildClearSessionResponse(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
