import { SignJWT, jwtVerify } from "jose";
import { authConfig, getJwtSecret } from "@/lib/config";
import { cookies } from "next/headers";

export type SessionPayload = {
  sub: string;
  email: string;
  activeWorkspaceId?: number;
  activeWorkspaceRole?: 'OWNER' | 'MEMBER';
};

const encoder = new TextEncoder();

function getSigningKey() {
  return encoder.encode(getJwtSecret());
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ 
    email: payload.email,
    activeWorkspaceId: payload.activeWorkspaceId,
    activeWorkspaceRole: payload.activeWorkspaceRole
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${authConfig.sessionMaxAgeSeconds}s`)
    .sign(getSigningKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSigningKey());
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    const email = typeof payload.email === "string" ? payload.email : null;
    const activeWorkspaceId = typeof payload.activeWorkspaceId === "number" ? payload.activeWorkspaceId : undefined;
    const activeWorkspaceRole = typeof payload.activeWorkspaceRole === "string" ? (payload.activeWorkspaceRole as 'OWNER' | 'MEMBER') : undefined;
    
    if (!sub || !email) return null;
    return { sub, email, activeWorkspaceId, activeWorkspaceRole };
  } catch {
    return null;
  }
}

export async function setActiveWorkspaceInSession(workspaceId: number, role: 'OWNER' | 'MEMBER') {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(authConfig.sessionCookieName);
  
  if (!sessionCookie) return null;

  const session = await verifySessionToken(sessionCookie.value);
  if (!session) return null;
  
  session.activeWorkspaceId = workspaceId;
  session.activeWorkspaceRole = role;

  const newSessionToken = await signSessionToken(session);
  
  cookieStore.set(authConfig.sessionCookieName, newSessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: authConfig.sessionMaxAgeSeconds,
  });

  return session;
}
