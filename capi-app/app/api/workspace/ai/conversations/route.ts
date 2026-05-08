import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { getWorkspaceAccessFromSession } from "@/lib/workspace-ai/workspace-access";

export async function GET() {
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

  const hasConversationModel = typeof (db as any).conversation?.findMany === "function";

  const rows = hasConversationModel
    ? await (db as any).conversation.findMany({
        where: {
          userId: access.userId,
          workspaceId: access.workspaceId,
        },
        orderBy: { updatedAt: "desc" },
        take: 50,
        select: {
          id: true,
          title: true,
          createdAt: true,
          updatedAt: true,
        },
      })
    : [];

  return NextResponse.json({
    success: true,
    conversations: rows.map((c: any) => ({
      id: c.id,
      title: c.title,
      createdAt: c.createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: c.updatedAt?.toISOString?.() ?? new Date().toISOString(),
    })),
  });

}
