const DEFAULT_SESSION_COOKIE_NAME = "flowlogix_session";
const DEFAULT_SESSION_MAX_AGE = 60 * 60 * 8; // 8 horas

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const authConfig = {
  sessionCookieName:
    process.env.SESSION_COOKIE_NAME?.trim() || DEFAULT_SESSION_COOKIE_NAME,
  sessionMaxAgeSeconds: Number(process.env.SESSION_MAX_AGE_SECONDS || DEFAULT_SESSION_MAX_AGE),
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
};

/** Secreto para firmar JWT (preferido). Compatibilidad: SESSION_SECRET si JWT_SECRET no está definido. */
export function getJwtSecret(): string {
  const fromJwt = process.env.JWT_SECRET?.trim();
  if (fromJwt) return fromJwt;
  const fromSession = process.env.SESSION_SECRET?.trim();
  if (fromSession) return fromSession;
  return requireEnv("JWT_SECRET");
}
