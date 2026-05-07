import { WorkspaceRole } from "@prisma/client";

export type DashboardWorkspaceHref =
  | "/dashboard/owner"
  | "/dashboard/member"
  | "/dashboard/workspace";

export function sessionRoleFromMembership(role: WorkspaceRole): WorkspaceRole {
  return role;
}

/**
 * Destino al abrir un workspace: el asistente contextual es el hub principal
 * para ADMIN y MEMBER; OWNER conserva el panel avanzado por defecto.
 */
export function dashboardHrefForSessionRole(role: WorkspaceRole): DashboardWorkspaceHref {
  if (role === WorkspaceRole.OWNER) return "/dashboard/owner";
  if (role === WorkspaceRole.ADMIN) return "/dashboard/workspace";
  return "/dashboard/workspace";
}
