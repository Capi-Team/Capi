import { NextResponse } from "next/server";
import { WorkspaceRole } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { readJsonRecordFromRequest } from "@/lib/http/json";


type RouteContext = { params: Promise<{ id: string }> };



export async function PATCH(request: Request, context: RouteContext) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const userId = Number.parseInt(session.sub, 10);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ success: false, message: "Invalid session." }, { status: 401 });
  }

  const { id } = await context.params;
  const workspaceId = Number.parseInt(id, 10);
  if (!Number.isFinite(workspaceId) || workspaceId < 1) {
    return NextResponse.json(
      { success: false, message: "A valid workspace id is required." },
      { status: 400 }
    );
  }

  const membership = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
    select: { role: true },
  });
  if (!membership) {
    return NextResponse.json(
      { success: false, message: "You are not a member of this workspace." },
      { status: 403 }
    );
  }
  if (membership.role !== WorkspaceRole.OWNER && membership.role !== WorkspaceRole.ADMIN) {
    return NextResponse.json(
      { success: false, message: "Only owners or admins can edit workspace profile." },
      { status: 403 }
    );
  }

  // body no longer accepts imageUrl
  const parsed = await readJsonRecordFromRequest(request);
  if (!parsed.ok) {
    return NextResponse.json({ success: false, message: "Invalid request." }, { status: 400 });
  }

  // Keep endpoint stable but ignore any imageUrl.
  const workspace = await db.workspace.update({
    where: { id: workspaceId },
    data: {},
    select: {
      id: true,
      name: true,
    },
  });



  return NextResponse.json({ success: true, workspace });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const userId = Number.parseInt(session.sub, 10);
  if (!Number.isFinite(userId)) {
    return NextResponse.json({ success: false, message: "Invalid session." }, { status: 401 });
  }

  const { id } = await context.params;
  const workspaceId = Number.parseInt(id, 10);
  if (!Number.isFinite(workspaceId) || workspaceId < 1) {
    return NextResponse.json(
      { success: false, message: "A valid workspace id is required." },
      { status: 400 }
    );
  }

  const membership = await db.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
    select: { role: true },
  });
  if (!membership) {
    return NextResponse.json(
      { success: false, message: "You are not a member of this workspace." },
      { status: 403 }
    );
  }
  if (membership.role !== WorkspaceRole.OWNER) {
    return NextResponse.json(
      { success: false, message: "Only owners can delete a workspace." },
      { status: 403 }
    );
  }

  await db.workspace.delete({ where: { id: workspaceId } });
  return NextResponse.json({ success: true });
}
