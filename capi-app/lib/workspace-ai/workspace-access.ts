import type { SessionPayload } from "@/lib/auth";
import type { WorkspaceRole } from "@prisma/client";
import { db } from "@/lib/db";

export type WorkspaceAccess = {
  userId: number;
  workspaceId: number;
  role: WorkspaceRole;
};

/**
 * Resuelve acceso al workspace activo en sesión usando la base de datos como fuente de verdad
 * (evita JWT desactualizado y refuerza multi-tenant).
 */
export async function getWorkspaceAccessFromSession(
  session: SessionPayload | null
): Promise<WorkspaceAccess | null> {
  if (!session?.activeWorkspaceId) return null;
  const userId = Number.parseInt(session.sub, 10);
  if (!Number.isFinite(userId)) return null;

  const member = await db.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId,
        workspaceId: session.activeWorkspaceId,
      },
    },
  });

  if (!member) return null;

  return {
    userId,
    workspaceId: session.activeWorkspaceId,
    role: member.role,
  };
}
