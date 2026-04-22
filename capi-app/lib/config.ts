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
  sessionSecret: process.env.SESSION_SECRET || "",
  sessionMaxAgeSeconds: Number(process.env.SESSION_MAX_AGE_SECONDS || DEFAULT_SESSION_MAX_AGE),
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI || "",
  appUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
};

export function getSessionSecret(): string {
  if (!authConfig.sessionSecret) {
    return requireEnv("SESSION_SECRET");
  }
  return authConfig.sessionSecret;
}

export function getGoogleConfig() {
  if (!authConfig.googleClientId || !authConfig.googleClientSecret || !authConfig.googleRedirectUri) {
    throw new Error(
      "Google OAuth is not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI."
    );
  }

  return {
    clientId: authConfig.googleClientId,
    clientSecret: authConfig.googleClientSecret,
    redirectUri: authConfig.googleRedirectUri,
  };
}
