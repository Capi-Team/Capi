import { WorkspaceRole } from "@prisma/client";

export function workspaceRoleShowsInviteCode(role: WorkspaceRole): boolean {
  return role === WorkspaceRole.OWNER || role === WorkspaceRole.ADMIN;
}
