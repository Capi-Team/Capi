import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comparePassword, hashPassword, setSessionCookie, signSession } from "@/lib/auth";
import { authConfig, getGoogleConfig } from "@/lib/config";

const MIN_PASSWORD_LENGTH = 8;
const SPECIAL_CHARACTERS = "!@#$%^&*()_+-=[]{}|;:,.<>?";
const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?]/;
const GENERIC_AUTH_ERROR = "Credenciales inválidas.";

type AuthAction = "register" | "login" | "google";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getEmailDomain(email: string): string {
  return email.split("@")[1]?.toLowerCase() ?? "";
}

function toSafeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function toSafeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function hasRequiredSpecialChar(password: string): boolean {
  return SPECIAL_CHAR_REGEX.test(password);
}

function getAllowedRegistrationDomains(): string[] {
  const raw = process.env.ALLOWED_REGISTRATION_DOMAINS || "";
  return raw
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

async function resolveDefaultRoleId(): Promise<number | null> {
  const preferredRoles = ["employee", "user", "member"];
  const role = await db.roles.findFirst({
    where: { name: { in: preferredRoles } },
    orderBy: { id: "asc" },
  });

  if (role) return role.id;

  const firstRole = await db.roles.findFirst({ orderBy: { id: "asc" } });
  return firstRole?.id ?? null;
}

async function resolveCompanyByEmail(email: string) {
  const domain = getEmailDomain(email);
  if (!domain) return null;

  return db.companies.findFirst({
    where: {
      domain: {
        equals: domain,
        mode: "insensitive",
      },
    },
  });
}

async function handleRegister(body: Record<string, unknown>) {
  const email = toSafeEmail(body.email);
  const password = toSafeString(body.password);
  const confirmPassword = toSafeString(body.confirmPassword);
  const allowPublicRegistration = process.env.ALLOW_PUBLIC_REGISTRATION === "true";
  const allowedDomains = getAllowedRegistrationDomains();
  const autoApproveUsers = process.env.AUTO_APPROVE_USERS === "true";

  if (!email || !password || !confirmPassword) {
    return NextResponse.json(
      { success: false, message: "Completa todos los campos requeridos." },
      { status: 400 }
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { success: false, message: "El correo no tiene un formato válido." },
      { status: 400 }
    );
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { success: false, message: "La contraseña debe tener al menos 8 caracteres." },
      { status: 400 }
    );
  }

  if (!hasRequiredSpecialChar(password)) {
    return NextResponse.json(
      {
        success: false,
        message: `La contraseña debe incluir al menos un caracter especial: ${SPECIAL_CHARACTERS}`,
      },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return NextResponse.json(
      { success: false, message: "Las contraseñas no coinciden." },
      { status: 400 }
    );
  }

  const existingUser = await db.users.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json(
      { success: false, message: "No se pudo completar el registro." },
      { status: 409 }
    );
  }

  const domain = getEmailDomain(email);
  let company = await resolveCompanyByEmail(email);
  if (!company && !allowPublicRegistration) {
    if (domain && allowedDomains.includes(domain)) {
      company = await db.companies.create({
        data: {
          name: domain,
          domain,
        },
      });
    } else {
    return NextResponse.json(
      {
        success: false,
        message: "Tu organización no está habilitada para registro en este entorno.",
      },
      { status: 403 }
    );
    }
  }

  const roleId = await resolveDefaultRoleId();
  const passwordHash = await hashPassword(password);

  await db.users.create({
    data: {
      email,
      password: passwordHash,
      provider: "local",
      company_id: company?.id ?? null,
      role_id: roleId,
      is_approved: autoApproveUsers,
    },
  });

  return NextResponse.json(
    {
      success: true,
      message: autoApproveUsers
        ? "Registro creado correctamente."
        : "Registro creado correctamente. Tu cuenta está pendiente de aprobación.",
    },
    { status: 201 }
  );
}

async function handleLogin(body: Record<string, unknown>) {
  const email = toSafeEmail(body.email);
  const password = toSafeString(body.password);
  const autoApproveUsers = process.env.AUTO_APPROVE_USERS === "true";

  if (!email || !password) {
    return NextResponse.json(
      { success: false, message: GENERIC_AUTH_ERROR },
      { status: 400 }
    );
  }

  let user = await db.users.findUnique({ where: { email } });
  const passwordHash = user?.password ?? null;
  const passwordOk = passwordHash ? await comparePassword(password, passwordHash) : false;

  if (!user || !passwordOk) {
    return NextResponse.json(
      { success: false, message: GENERIC_AUTH_ERROR },
      { status: 401 }
    );
  }

  if (!user.is_approved && autoApproveUsers) {
    user = await db.users.update({
      where: { id: user.id },
      data: { is_approved: true },
    });
  }

  if (!user.is_approved) {
    return NextResponse.json(
      {
        success: false,
        code: "PENDING_APPROVAL",
        message: "Tu usuario está pendiente de aprobación por un administrador.",
      },
      { status: 403 }
    );
  }

  const token = await signSession({
    sub: String(user.id),
    email: user.email,
    companyId: user.company_id ?? null,
    roleId: user.role_id ?? null,
    provider: user.provider === "google" ? "google" : "local",
  });

  await setSessionCookie(token);

  return NextResponse.json({
    success: true,
    redirectTo: "/dashboard",
  });
}

function createGoogleState() {
  return crypto.randomBytes(24).toString("hex");
}

function getGoogleAuthUrl(state: string): string {
  const { clientId, redirectUri } = getGoogleConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    prompt: "select_account",
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

async function exchangeGoogleCode(code: string) {
  const { clientId, clientSecret, redirectUri } = getGoogleConfig();
  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
    cache: "no-store",
  });

  if (!tokenResponse.ok) {
    return null;
  }

  return tokenResponse.json() as Promise<{ access_token?: string }>;
}

async function fetchGoogleUserInfo(accessToken: string) {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return response.json() as Promise<{
    sub?: string;
    email?: string;
    email_verified?: boolean;
  }>;
}

async function completeGoogleAuth(code: string) {
  const autoApproveUsers = process.env.AUTO_APPROVE_USERS === "true";
  const tokenData = await exchangeGoogleCode(code);
  const accessToken = tokenData?.access_token;

  if (!accessToken) {
    return {
      error: "No fue posible validar la autenticación con Google.",
      status: 401,
    };
  }

  const googleProfile = await fetchGoogleUserInfo(accessToken);
  const googleEmail = toSafeEmail(googleProfile?.email);
  const googleSub = toSafeString(googleProfile?.sub);

  if (!googleProfile?.email_verified || !googleEmail || !googleSub) {
    return {
      error: "No fue posible validar la cuenta de Google.",
      status: 401,
    };
  }

  const company = await resolveCompanyByEmail(googleEmail);
  if (!company) {
    return {
      error: "Tu organización no está habilitada para acceso con Google.",
      status: 403,
    };
  }

  let user = await db.users.findUnique({ where: { email: googleEmail } });

  if (!user) {
    const roleId = await resolveDefaultRoleId();
    user = await db.users.create({
      data: {
        email: googleEmail,
        provider: "google",
        google_id: googleSub,
        company_id: company.id,
        role_id: roleId,
        is_approved: autoApproveUsers,
        password: null,
      },
    });
  } else if (!user.google_id || user.provider !== "google") {
    user = await db.users.update({
      where: { id: user.id },
      data: {
        google_id: user.google_id ?? googleSub,
        provider: "google",
        company_id: user.company_id ?? company.id,
      },
    });
  }

  if (!user.is_approved && autoApproveUsers) {
    user = await db.users.update({
      where: { id: user.id },
      data: { is_approved: true },
    });
  }

  if (!user.is_approved) {
    return {
      error: "Tu usuario está pendiente de aprobación por un administrador.",
      status: 403,
      pendingApproval: true,
    };
  }

  const token = await signSession({
    sub: String(user.id),
    email: user.email,
    companyId: user.company_id ?? null,
    roleId: user.role_id ?? null,
    provider: "google",
  });
  await setSessionCookie(token);

  return { redirectTo: "/dashboard" };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action");

  if (action === "google") {
    try {
      const state = createGoogleState();
      const response = NextResponse.redirect(getGoogleAuthUrl(state));
      response.cookies.set("flowlogix_google_state", state, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 10,
      });
      return response;
    } catch {
      return NextResponse.json(
        { success: false, message: "Google OAuth no está configurado en el servidor." },
        { status: 500 }
      );
    }
  }

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  if (code && state) {
    const stateCookie = request.cookies.get("flowlogix_google_state")?.value;
    if (!stateCookie || stateCookie !== state) {
      return NextResponse.redirect(
        `${authConfig.appUrl}/auth/login?error=google_state_invalid`
      );
    }

    const authResult = await completeGoogleAuth(code);
    const baseResponse = NextResponse.redirect(
      authResult.redirectTo
        ? `${authConfig.appUrl}${authResult.redirectTo}`
        : `${authConfig.appUrl}/auth/login?error=${
            authResult.pendingApproval ? "pending_approval" : "google_auth_failed"
          }`
    );
    baseResponse.cookies.set("flowlogix_google_state", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return baseResponse;
  }

  return NextResponse.json(
    { success: false, message: "Operación de autenticación no soportada." },
    { status: 400 }
  );
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch (error) {
    console.error("[auth][post] Invalid JSON body", error);
    return NextResponse.json(
      { success: false, message: "Solicitud inválida." },
      { status: 400 }
    );
  }

  const action = toSafeString(body.action) as AuthAction;

  if (action === "register") {
    try {
      return await handleRegister(body);
    } catch (error) {
      console.error("[auth][register] Unhandled server error", error);
      throw error;
    }
  }

  if (action === "login") {
    try {
      return await handleLogin(body);
    } catch (error) {
      console.error("[auth][login] Unhandled server error", error);
      throw error;
    }
  }

  return NextResponse.json(
    { success: false, message: "Acción de autenticación no soportada." },
    { status: 400 }
  );
}
