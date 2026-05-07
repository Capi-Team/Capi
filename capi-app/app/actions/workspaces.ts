"use server";

import { WorkspaceRole } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { authConfig } from "@/lib/config";
import { verifySessionToken, setActiveWorkspaceInSession } from "@/lib/jwt-session";
import { generateInviteCode } from "@/lib/workspace-code";
import { toTrimmedString } from "@/lib/strings/coerce";
import {
  dashboardHrefForSessionRole,
  sessionRoleFromMembership,
} from "@/lib/workspaces/dashboard-path";

async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(authConfig.sessionCookieName)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function createWorkspace(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");

  const userId = Number.parseInt(session.sub, 10);
  if (!Number.isFinite(userId)) throw new Error("Invalid session.");

  const name = toTrimmedString(formData.get("name"));
  if (!name || name.length < 2) {
    throw new Error("Workspace name must be at least 2 characters.");
  }

  const duplicateMembership = await db.workspaceMember.findFirst({
    where: {
      userId,
      workspace: {
        name: { equals: name, mode: "insensitive" },
      },
    },
    select: { id: true },
  });

  if (duplicateMembership) {
    throw new Error("You already belong to a workspace with this name.");
  }

  let inviteCode = generateInviteCode();
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const clash = await db.workspace.findUnique({ where: { inviteCode } });
    if (!clash) break;
    inviteCode = generateInviteCode();
  }

  const newWorkspace = await db.workspace.create({
    data: {
      name: name.slice(0, 255),
      inviteCode,
      createdById: userId,
      members: {
        create: {
          userId,
          role: WorkspaceRole.OWNER,
        },
      },
    },
  });

  await setActiveWorkspaceInSession(newWorkspace.id, "OWNER");
  redirect("/dashboard/owner");
}

export async function joinWorkspace(workspaceId: number) {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated.");

  const userId = Number.parseInt(session.sub, 10);
  if (!Number.isFinite(userId)) throw new Error("Invalid session.");

  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) throw new Error("Workspace not found.");

  const existingMember = await db.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        workspaceId,
        userId,
      },
    },
  });

  let membershipRole: WorkspaceRole;

  if (!existingMember) {
    await db.workspaceMember.create({
      data: {
        workspaceId,
        userId,
        role: WorkspaceRole.MEMBER,
      },
    });
    membershipRole = WorkspaceRole.MEMBER;
  } else {
    membershipRole = existingMember.role;
  }

  const sessionRole = sessionRoleFromMembership(membershipRole);
  await setActiveWorkspaceInSession(workspaceId, sessionRole);
  redirect(dashboardHrefForSessionRole(sessionRole));
}
