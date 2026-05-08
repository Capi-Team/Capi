import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getWorkspaceAccessFromSession } from "@/lib/workspace-ai/workspace-access";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const access = await getWorkspaceAccessFromSession(session);
  if (!access) {
    return NextResponse.json(
      { success: false, message: "Selecciona un workspace desde el hub." },
      { status: 400 }
    );
  }

  const { id } = await context.params;
  const conversationId = Number.parseInt(id, 10);
  if (!Number.isFinite(conversationId)) {
    return NextResponse.json({ success: false, message: "ID inválido." }, { status: 400 });
  }

  const hasConversationModel = typeof (db as any).conversation?.findFirst === "function";
  const conversation = hasConversationModel
    ? await (db as any).conversation.findFirst({
        where: {
          id: conversationId,
          userId: access.userId,
          workspaceId: access.workspaceId,
        },
      })
    : null;


  if (!conversation) {
    return NextResponse.json({ success: false, message: "No encontrado." }, { status: 404 });
  }

  const hasChatMessageModel = typeof (db as any).chatMessage?.findMany === "function";
  const messages = hasChatMessageModel
    ? await (db as any).chatMessage.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: "asc" },
        take: 500,
      })
    : [];


  return NextResponse.json({
    success: true,
    conversation: {
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt.toISOString(),
      updatedAt: conversation.updatedAt.toISOString(),
    },
    messages: messages.map((m: any) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt?.toISOString?.() ?? new Date().toISOString(),
    })),

  });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const access = await getWorkspaceAccessFromSession(session);
  if (!access) {
    return NextResponse.json(
      { success: false, message: "Selecciona un workspace desde el hub." },
      { status: 400 }
    );
  }

  const { id } = await context.params;
  const conversationId = Number.parseInt(id, 10);
  if (!Number.isFinite(conversationId)) {
    return NextResponse.json({ success: false, message: "ID invalido." }, { status: 400 });
  }

  const hasConversationModel = typeof (db as any).conversation?.findFirst === "function";
  const conversation = hasConversationModel
    ? await (db as any).conversation.findFirst({
        where: {
          id: conversationId,
          userId: access.userId,
          workspaceId: access.workspaceId,
        },
        select: { id: true },
      })
    : null;


  if (!conversation) {
    return NextResponse.json({ success: false, message: "No encontrado." }, { status: 404 });
  }

  if ((db as any).conversation?.delete) {
    await (db as any).conversation.delete({
      where: { id: conversation.id },
    });
  }


  return NextResponse.json({ success: true });
}
