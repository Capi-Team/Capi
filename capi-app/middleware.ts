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

  const role = session.activeWorkspaceRole;

  // Solo restringir rutas específicas por rol
  // /dashboard y /dashboard/* son accesibles si hay sesión válida
  // /dashboard/owner requiere rol OWNER
  if (pathname.startsWith('/dashboard/owner') && role !== 'OWNER') {
    return NextResponse.redirect(new URL('/dashboard/unauthorized', request.url));
  }

  // /dashboard/member requiere rol MEMBER (o OWNER que también puede verlo)
  if (pathname.startsWith('/dashboard/member') && role !== 'MEMBER' && role !== 'OWNER' && role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/dashboard/unauthorized', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
