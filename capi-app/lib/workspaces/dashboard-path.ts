import { WorkspaceRole } from "@prisma/client";

export type DashboardWorkspaceHref = "/dashboard/owner" | "/dashboard/member";

export function sessionRoleFromMembership(role: WorkspaceRole): "OWNER" | "MEMBER" {
  return role === WorkspaceRole.OWNER ? "OWNER" : "MEMBER";
}

export function dashboardHrefForSessionRole(
  sessionRole: "OWNER" | "MEMBER"
): DashboardWorkspaceHref {
  return sessionRole === "OWNER" ? "/dashboard/owner" : "/dashboard/member";
}
