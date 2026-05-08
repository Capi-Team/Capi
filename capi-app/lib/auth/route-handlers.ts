import { NextResponse } from "next/server";
import { comparePassword, hashPassword, setSessionCookie, signSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { GENERIC_AUTH_ERROR, MIN_PASSWORD_LENGTH } from "@/lib/auth/constants";
import { isValidEmail } from "@/lib/auth/validators";
import { toEmailAddress, toTrimmedString } from "@/lib/strings/coerce";

export async function handleRegisterBody(body: Record<string, unknown>) {
  const email = toEmailAddress(body.email);
  const password = toTrimmedString(body.password);
  const confirmPassword = toTrimmedString(body.confirmPassword);

  if (!email || !password || !confirmPassword) {
    return NextResponse.json(
      { success: false, message: "Fill in every required field." },
      { status: 400 }
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      { success: false, message: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      {
        success: false,
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      },
      { status: 400 }
    );
  }

  if (password !== confirmPassword) {
    return NextResponse.json(
      { success: false, message: "Passwords do not match." },
      { status: 400 }
    );
  }

  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json(
      { success: false, message: "An account with this email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);

  await db.user.create({
    data: {
      email,
      passwordHash,
    },
  });

  return NextResponse.json(
    {
      success: true,
      message: "Account created successfully.",
    },
    { status: 201 }
  );
}

export async function handleLoginBody(body: Record<string, unknown>) {
  const email = toEmailAddress(body.email);
  const password = toTrimmedString(body.password);

  if (!email || !password) {
    return NextResponse.json(
      { success: false, message: GENERIC_AUTH_ERROR },
      { status: 400 }
    );
  }

  const user = await db.user.findUnique({ where: { email } });
  const passwordHash = user?.passwordHash ?? null;
  const passwordOk = passwordHash ? await comparePassword(password, passwordHash) : false;

  if (!user || !passwordOk) {
    return NextResponse.json(
      { success: false, message: GENERIC_AUTH_ERROR },
      { status: 401 }
    );
  }

  const token = await signSession({
    sub: String(user.id),
    email: user.email,
  });

  await setSessionCookie(token);

  return NextResponse.json({
    success: true,
    redirectTo: "/dashboard",
  });
}
