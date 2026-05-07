import { NextRequest, NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { readJsonRecordFromRequest } from "@/lib/http/json";
import { setActiveWorkspaceInSession } from "@/lib/jwt-session";
import {
  dashboardHrefForSessionRole,
  sessionRoleFromMembership,
} from "@/lib/workspaces/dashboard-path";

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const parsed = await readJsonRecordFromRequest(request);
  if (!parsed.ok) {
    return NextResponse.json({ success: false, message: "Invalid request." }, { status: 400 });
  }

  const workspaceIdRaw = parsed.body.workspaceId;
  const workspaceId =
    typeof workspaceIdRaw === "number"
      ? workspaceIdRaw
      : typeof workspaceIdRaw === "string"
        ? Number.parseInt(workspaceIdRaw, 10)
        : NaN;

  if (!Number.isFinite(workspaceId) || workspaceId < 1) {
    return NextResponse.json(
      { success: false, message: "A valid workspace id is required." },
      { status: 400 }
    );
  }

  const userId = Number.parseInt(session.sub, 10);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ success: false, message: "Invalid session." }, { status: 401 });
  }

  const membership = await db.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId, workspaceId },
    },
    select: { role: true },
  });

  if (!membership) {
    return NextResponse.json(
      { success: false, message: "You are not a member of this workspace." },
      { status: 403 }
    );
  }

  const sessionRole = sessionRoleFromMembership(membership.role);
  await setActiveWorkspaceInSession(workspaceId, sessionRole);

  return NextResponse.json({
    success: true,
    redirectTo: dashboardHrefForSessionRole(sessionRole),
  });
}
