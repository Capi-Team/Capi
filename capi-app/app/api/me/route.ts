import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { readJsonRecordFromRequest } from "@/lib/http/json";
import { toTrimmedString } from "@/lib/strings/coerce";

function sanitizeUrl(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  const text = toTrimmedString(value);
  if (!text) return null;
  if (text.length > 2_000_000) return null;
  if (!/^https?:\/\//i.test(text) && !/^data:image\/[a-zA-Z0-9.+-]+;base64,/i.test(text)) {
    return null;
  }
  return text;
}

export async function PATCH(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const userId = Number.parseInt(session.sub, 10);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ success: false, message: "Invalid session." }, { status: 401 });
  }

  const parsed = await readJsonRecordFromRequest(request);
  if (!parsed.ok) {
    return NextResponse.json({ success: false, message: "Invalid request." }, { status: 400 });
  }

  const profileBioRaw = parsed.body.profileBio;
  const avatarUrl = sanitizeUrl(parsed.body.avatarUrl);
  if (parsed.body.avatarUrl !== undefined && avatarUrl === null) {
    return NextResponse.json(
      { success: false, message: "Avatar URL must be a valid http/https URL or a base64 image." },
      { status: 400 }
    );
  }

  const profileBio =
    profileBioRaw === undefined ? undefined : toTrimmedString(profileBioRaw)?.slice(0, 1000) || null;

  const user = await db.user.update({
    where: { id: userId },
    data: {
      ...(profileBio !== undefined ? { profileBio } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    },
    select: {
      id: true,
      email: true,
      profileBio: true,
      avatarUrl: true,
    },
  });

  return NextResponse.json({ success: true, user });
}
