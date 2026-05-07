import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { workspaceRoleShowsInviteCode } from "@/lib/workspaces/invite-visibility";
import DashboardClient from "./dashboard-client";

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session) {
    redirect("/auth/login");
  }

  const userId = Number.parseInt(session.sub, 10);
  if (!Number.isFinite(userId)) {
    redirect("/auth/login");
  }

  const memberships = await db.workspaceMember.findMany({
    where: { userId },
    include: {
      workspace: { select: { id: true, name: true, inviteCode: true, imageUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const currentUser = await db.user.findUnique({
    where: { id: userId },
    select: { profileBio: true, avatarUrl: true },
  });

  const workspaces = memberships.map((m) => ({
    id: m.workspace.id,
    name: m.workspace.name,
    imageUrl: m.workspace.imageUrl,
    role: m.role,
    inviteCode: workspaceRoleShowsInviteCode(m.role) ? m.workspace.inviteCode : null,
  }));

  return (
    <DashboardClient
      email={session.email}
      profileBio={currentUser?.profileBio ?? null}
      avatarUrl={currentUser?.avatarUrl ?? null}
      workspaces={workspaces}
    />
  );
}
