import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { readJsonRecordFromRequest } from "@/lib/http/json";
import { getWorkspaceAccessFromSession } from "@/lib/workspace-ai/workspace-access";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const access = await getWorkspaceAccessFromSession(session);
  if (!access) {
    return NextResponse.json(
      { success: false, message: "Select a workspace from the hub." },
      { status: 400 }
    );
  }
  if (access.role !== "OWNER" && access.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, message: "Only owner/admin can edit resources." },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const resourceId = Number.parseInt(id, 10);
  if (!Number.isFinite(resourceId)) {
    return NextResponse.json({ success: false, message: "Invalid ID." }, { status: 400 });
  }

  const parsed = await readJsonRecordFromRequest(request);
  if (!parsed.ok) {
    return NextResponse.json({ success: false, message: "Invalid request." }, { status: 400 });
  }
  if (typeof parsed.body.isPinned !== "boolean") {
    return NextResponse.json(
      { success: false, message: "isPinned boolean is required." },
      { status: 400 }
    );
  }

  const existing = await (db as any).workspaceResource.findFirst({
    where: {
      id: resourceId,
      workspaceId: access.workspaceId,
    },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ success: false, message: "Resource not found." }, { status: 404 });
  }

  await (db as any).workspaceResource.update({
    where: { id: existing.id },
    data: { isPinned: parsed.body.isPinned },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const access = await getWorkspaceAccessFromSession(session);
  if (!access) {
    return NextResponse.json(
      { success: false, message: "Select a workspace from the hub." },
      { status: 400 }
    );
  }
  if (access.role !== "OWNER" && access.role !== "ADMIN") {
    return NextResponse.json(
      { success: false, message: "Only owner/admin can delete resources." },
      { status: 403 }
    );
  }

  const { id } = await context.params;
  const resourceId = Number.parseInt(id, 10);
  if (!Number.isFinite(resourceId)) {
    return NextResponse.json({ success: false, message: "Invalid ID." }, { status: 400 });
  }

  const existing = await (db as any).workspaceResource.findFirst({
    where: {
      id: resourceId,
      workspaceId: access.workspaceId,
    },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ success: false, message: "Resource not found." }, { status: 404 });
  }

  await (db as any).workspaceResource.delete({
    where: { id: existing.id },
  });

  return NextResponse.json({ success: true });
}
