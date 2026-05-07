import { NextResponse } from "next/server";
import { WorkspaceRole } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { readJsonRecordFromRequest } from "@/lib/http/json";
import { toTrimmedString } from "@/lib/strings/coerce";

type RouteContext = { params: Promise<{ id: string }> };

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

  const parsed = await readJsonRecordFromRequest(request);
  if (!parsed.ok) {
    return NextResponse.json({ success: false, message: "Invalid request." }, { status: 400 });
  }

  const imageUrl = sanitizeUrl(parsed.body.imageUrl);
  if (parsed.body.imageUrl !== undefined && imageUrl === null) {
    return NextResponse.json(
      {
        success: false,
        message: "Workspace image URL must be a valid http/https URL or a base64 image.",
      },
      { status: 400 }
    );
  }

  const workspace = await db.workspace.update({
    where: { id: workspaceId },
    data: {
      ...(imageUrl !== undefined ? { imageUrl } : {}),
    },
    select: {
      id: true,
      name: true,
      imageUrl: true,
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
