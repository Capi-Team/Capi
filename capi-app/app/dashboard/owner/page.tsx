import type { CSSProperties } from "react";
import { redirect } from "next/navigation";
import { WorkspaceRole } from "@prisma/client";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  changeMemberRoleAction,
  regenerateInviteCodeAction,
  removeMemberAction,
} from "./actions";

type OwnerDashboardPageProps = {
  searchParams?: Promise<{ toast?: string }> | { toast?: string };
};

function toastTextFromKey(key: string | undefined): string | null {
  if (key === "role-updated") return "Member role updated.";
  if (key === "member-removed") return "Member removed from workspace.";
  if (key === "invite-regenerated") return "Invite code regenerated.";
  return null;
}

export default async function OwnerDashboardPage({ searchParams }: OwnerDashboardPageProps) {
  const session = await getCurrentSession();
  if (!session) redirect("/auth/login");
  if (session.activeWorkspaceRole !== "OWNER") redirect("/dashboard/unauthorized");
  if (!session.activeWorkspaceId) redirect("/dashboard");
  const resolvedSearchParams = searchParams
    ? await Promise.resolve(searchParams)
    : undefined;
  const toastText = toastTextFromKey(resolvedSearchParams?.toast);

  const members = (await (db.workspaceMember as any).findMany({
    where: { workspaceId: session.activeWorkspaceId },
    include: {
      user: {
        select: { id: true, email: true, avatarUrl: true, profileBio: true },
      },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  })) as Array<{
    id: number;
    role: WorkspaceRole;
    user: { id: number; email: string; avatarUrl: string | null; profileBio: string | null };
  }>;

  const workspace = (await (db.workspace as any).findUnique({
    where: { id: session.activeWorkspaceId },
    select: { id: true, name: true, imageUrl: true, inviteCode: true },
  })) as { id: number; name: string; imageUrl: string | null; inviteCode: string | null } | null;

  return (
    <div className="p-8">
      {toastText ? (
        <div className="fixed right-6 top-20 z-50 rounded-lg border border-emerald-400/35 bg-emerald-500/15 px-4 py-2 text-sm text-emerald-200 shadow-[0_16px_40px_rgba(16,185,129,0.18)] backdrop-blur">
          {toastText}
        </div>
      ) : null}
      <section
        className="card-enter rounded-2xl border border-white/10 bg-black/35 p-6"
        style={{ "--enter-delay": "20ms" } as CSSProperties}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-4">
            {workspace?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={workspace.imageUrl}
                alt={`${workspace.name} workspace image`}
                className="h-20 w-20 rounded-2xl border border-white/20 object-cover shadow-[0_10px_28px_rgba(0,0,0,0.35)]"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-2xl font-semibold text-white shadow-[0_10px_28px_rgba(0,0,0,0.35)]">
                {(workspace?.name?.trim().charAt(0).toUpperCase() || "W")}
              </div>
            )}
            <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Workspace access</p>
            <h2 className="mt-1 text-xl font-semibold text-white">{workspace?.name ?? "Workspace"}</h2>
            </div>
          </div>
          <form action={regenerateInviteCodeAction}>
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-3 text-xs text-zinc-100 transition hover:bg-white/20"
            >
              Regenerate invite code
            </button>
          </form>
        </div>
        <div className="mt-3 rounded-lg border border-white/15 bg-white/5 px-3 py-2 font-mono text-sm text-zinc-200">
          Invite code: {workspace?.inviteCode ?? "N/A"}
        </div>
      </section>

      <section
        className="card-enter mt-6 rounded-2xl border border-white/10 bg-black/35 p-6"
        style={{ "--enter-delay": "90ms" } as CSSProperties}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Member management</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Workspace members</h2>
          </div>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-zinc-300">
            {members.length} members
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {members.map((member) => {
            const isOwner = member.role === WorkspaceRole.OWNER;
            const initial = member.user.email.trim().charAt(0).toUpperCase() || "?";
            return (
              <div
                key={member.id}
                className="landing-glass rounded-xl border border-white/10 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {member.user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.user.avatarUrl}
                        alt={`${member.user.email} avatar`}
                        className="h-10 w-10 rounded-full border border-white/20 object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-semibold text-white">
                        {initial}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">{member.user.email}</p>
                      <p className="text-xs uppercase tracking-wide text-zinc-400">{member.role}</p>
                      {member.user.profileBio ? (
                        <p className="mt-1 line-clamp-2 text-xs text-zinc-400">{member.user.profileBio}</p>
                      ) : null}
                    </div>
                  </div>

                  {isOwner ? (
                    <span className="rounded-md border border-white/15 bg-white/10 px-2 py-1 text-xs text-zinc-200">
                      Owner
                    </span>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <form action={changeMemberRoleAction} className="flex items-center gap-2">
                        <input type="hidden" name="targetMemberId" value={member.id} />
                        <select
                          name="nextRole"
                          defaultValue={member.role}
                          className="select-dark h-9 rounded-lg px-2 text-xs"
                        >
                          <option value="MEMBER">MEMBER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                        <button
                          type="submit"
                          className="h-9 rounded-lg border border-white/20 bg-white/10 px-3 text-xs text-zinc-100 transition hover:bg-white/20"
                        >
                          Save role
                        </button>
                      </form>

                      <form action={removeMemberAction}>
                        <input type="hidden" name="targetMemberId" value={member.id} />
                        <button
                          type="submit"
                          className="h-9 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 text-xs text-rose-100 transition hover:bg-rose-500/20"
                        >
                          Remove
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
