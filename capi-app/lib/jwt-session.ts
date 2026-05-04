import { SignJWT, jwtVerify } from "jose";
import { authConfig, getJwtSecret } from "@/lib/config";

export type SessionPayload = {
  sub: string;
  email: string;
};

const encoder = new TextEncoder();

function getSigningKey() {
  return encoder.encode(getJwtSecret());
}

export async function signSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email })
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
    if (!sub || !email) return null;
    return { sub, email };
  } catch {
    return null;
  }
}
