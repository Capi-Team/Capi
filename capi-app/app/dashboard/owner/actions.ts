"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { WorkspaceRole } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { generateInviteCode } from "@/lib/workspace-code";

async function requireOwnerAccess() {
  const session = await getCurrentSession();
  if (!session) throw new Error("Unauthorized.");
  if (!session.activeWorkspaceId) throw new Error("No active workspace.");

  const userId = Number.parseInt(session.sub, 10);
  if (!Number.isFinite(userId)) throw new Error("Invalid session.");

  const ownerMembership = await db.workspaceMember.findUnique({
    where: {
      userId_workspaceId: { userId, workspaceId: session.activeWorkspaceId },
    },
    select: { id: true, role: true },
  });

  if (!ownerMembership || ownerMembership.role !== WorkspaceRole.OWNER) {
    throw new Error("Only owners can manage this panel.");
  }

  return { userId, workspaceId: session.activeWorkspaceId };
}

export async function changeMemberRoleAction(formData: FormData) {
  const { userId, workspaceId } = await requireOwnerAccess();

  const targetMemberId = Number.parseInt(`${formData.get("targetMemberId") ?? ""}`, 10);
  const nextRoleRaw = `${formData.get("nextRole") ?? ""}`.toUpperCase();
  const nextRole =
    nextRoleRaw === WorkspaceRole.ADMIN || nextRoleRaw === WorkspaceRole.MEMBER
      ? (nextRoleRaw as WorkspaceRole)
      : null;

  if (!Number.isFinite(targetMemberId) || !nextRole) return;

  const target = await db.workspaceMember.findFirst({
    where: {
      id: targetMemberId,
      workspaceId,
    },
    select: { id: true, userId: true, role: true },
  });
  if (!target) return;
  if (target.userId === userId) return;
  if (target.role === WorkspaceRole.OWNER) return;

  await db.workspaceMember.update({
    where: { id: target.id },
    data: { role: nextRole },
  });

  revalidatePath("/dashboard/owner");
  revalidatePath("/dashboard/member");
  revalidatePath("/dashboard");
  redirect("/dashboard/owner?toast=role-updated");
}

export async function removeMemberAction(formData: FormData) {
  const { userId, workspaceId } = await requireOwnerAccess();

  const targetMemberId = Number.parseInt(`${formData.get("targetMemberId") ?? ""}`, 10);
  if (!Number.isFinite(targetMemberId)) return;

  const target = await db.workspaceMember.findFirst({
    where: {
      id: targetMemberId,
      workspaceId,
    },
    select: { id: true, userId: true, role: true },
  });
  if (!target) return;
  if (target.userId === userId) return;
  if (target.role === WorkspaceRole.OWNER) return;

  await db.workspaceMember.delete({
    where: { id: target.id },
  });

  revalidatePath("/dashboard/owner");
  revalidatePath("/dashboard/member");
  revalidatePath("/dashboard");
  redirect("/dashboard/owner?toast=member-removed");
}

export async function regenerateInviteCodeAction() {
  const { workspaceId } = await requireOwnerAccess();

  let inviteCode = generateInviteCode();
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const clash = await db.workspace.findUnique({ where: { inviteCode } });
    if (!clash) break;
    inviteCode = generateInviteCode();
  }

  await db.workspace.update({
    where: { id: workspaceId },
    data: { inviteCode },
  });

  revalidatePath("/dashboard/owner");
  revalidatePath("/dashboard");
  redirect("/dashboard/owner?toast=invite-regenerated");
}
