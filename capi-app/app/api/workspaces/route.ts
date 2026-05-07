import { NextRequest, NextResponse } from "next/server";
import { WorkspaceRole } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { readJsonRecordFromRequest } from "@/lib/http/json";
import { generateInviteCode } from "@/lib/workspace-code";
import { toTrimmedString } from "@/lib/strings/coerce";
import { setActiveWorkspaceInSession } from "@/lib/jwt-session";

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const parsed = await readJsonRecordFromRequest(request);
  if (!parsed.ok) {
    return NextResponse.json({ success: false, message: "Invalid request." }, { status: 400 });
  }

  const name = toTrimmedString(parsed.body.name);
  if (!name || name.length < 2) {
    return NextResponse.json(
      { success: false, message: "Workspace name must be at least 2 characters." },
      { status: 400 }
    );
  }

  const userId = Number.parseInt(session.sub, 10);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ success: false, message: "Invalid session." }, { status: 401 });
  }

  const duplicateMembership = await db.workspaceMember.findFirst({
    where: {
      userId,
      workspace: {
        name: { equals: name, mode: "insensitive" },
      },
    },
    select: { id: true },
  });

  if (duplicateMembership) {
    return NextResponse.json(
      {
        success: false,
        message:
          "You already belong to a workspace with this name. Pick another name or open the existing one.",
      },
      { status: 409 }
    );
  }

  let inviteCode = generateInviteCode();
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const clash = await db.workspace.findUnique({ where: { inviteCode } });
    if (!clash) break;
    inviteCode = generateInviteCode();
  }

  const workspace = await db.workspace.create({
    data: {
      name: name.slice(0, 255),
      inviteCode,
      createdById: userId,
      members: {
        create: {
          userId,
          role: WorkspaceRole.OWNER,
        },
      },
    },
    select: {
      id: true,
      name: true,
      inviteCode: true,
    },
  });

  // Actualizamos la sesión con el nuevo workspace y rol OWNER
  await setActiveWorkspaceInSession(workspace.id, 'OWNER');

  return NextResponse.json({
    success: true,
    workspace,
    redirectTo: '/dashboard/owner',
  });
}
