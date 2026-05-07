import { WorkspaceRole } from "@prisma/client";

export function canEditWorkspaceAiConfig(role: WorkspaceRole): boolean {
  return role === WorkspaceRole.OWNER || role === WorkspaceRole.ADMIN;
}
