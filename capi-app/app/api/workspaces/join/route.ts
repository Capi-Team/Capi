import { NextRequest, NextResponse } from "next/server";
import { WorkspaceRole } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { readJsonRecordFromRequest } from "@/lib/http/json";
import { normalizeInviteCode } from "@/lib/workspace-code";
import { toTrimmedString } from "@/lib/strings/coerce";
import { setActiveWorkspaceInSession } from "@/lib/jwt-session";
import { dashboardHrefForSessionRole } from "@/lib/workspaces/dashboard-path";

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const parsed = await readJsonRecordFromRequest(request);
  if (!parsed.ok) {
    return NextResponse.json({ success: false, message: "Invalid request." }, { status: 400 });
  }

  const rawCode = toTrimmedString(parsed.body.inviteCode);
  const inviteCode = normalizeInviteCode(rawCode);
  if (!inviteCode) {
    return NextResponse.json(
      { success: false, message: "Enter a valid invite code." },
      { status: 400 }
    );
  }

  const userId = Number.parseInt(session.sub, 10);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ success: false, message: "Invalid session." }, { status: 401 });
  }

  const workspace = await db.workspace.findFirst({
    where: { inviteCode },
    select: { id: true, name: true },
  });

  if (!workspace) {
    return NextResponse.json(
      { success: false, message: "No workspace matches that invite code." },
      { status: 404 }
    );
  }

  const existing = await db.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId, workspaceId: workspace.id },
    },
  });

  if (existing) {
    await setActiveWorkspaceInSession(workspace.id, existing.role);
    return NextResponse.json({
      success: true,
      alreadyMember: true,
      workspace,
      redirectTo: dashboardHrefForSessionRole(existing.role),
    });
  }

  await db.workspaceMember.create({
    data: {
      userId,
      workspaceId: workspace.id,
      role: WorkspaceRole.MEMBER,
    },
  });

  await setActiveWorkspaceInSession(workspace.id, WorkspaceRole.MEMBER);

  return NextResponse.json({
    success: true,
    workspace,
    redirectTo: dashboardHrefForSessionRole(WorkspaceRole.MEMBER),
  });
}
