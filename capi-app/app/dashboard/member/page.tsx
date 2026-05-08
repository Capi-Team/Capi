import type { CSSProperties } from "react";
import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { MouseTiltCard } from "@/components/ui/mouse-tilt-card";

export default async function MemberDashboardPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/auth/login");
  if (session.activeWorkspaceRole !== "MEMBER" && session.activeWorkspaceRole !== "OWNER" && session.activeWorkspaceRole !== "ADMIN") {
    redirect("/dashboard/unauthorized");
  }
  if (!session.activeWorkspaceId) {
    redirect("/dashboard");
  }

  const members = await db.workspaceMember.findMany({
    where: { workspaceId: session.activeWorkspaceId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          avatarUrl: true,
          profileBio: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  return (
    <div className="p-8">
      <section
        className="card-enter rounded-2xl border border-white/10 bg-black/35 p-6"
        style={{ "--enter-delay": "20ms" } as CSSProperties}
      >
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Workspace overview</p>
        <p className="mt-2 text-sm text-zinc-300">
          Signed in as <span className="font-medium text-zinc-100">{session.email}</span>.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <MouseTiltCard className="landing-glass rounded-xl p-4 text-sm text-zinc-100">
            Assigned tasks
          </MouseTiltCard>
          <MouseTiltCard className="landing-glass rounded-xl p-4 text-sm text-zinc-100">
            Activity timeline
          </MouseTiltCard>
          <MouseTiltCard className="landing-glass rounded-xl p-4 text-sm text-zinc-100">
            Progress tracking
          </MouseTiltCard>
        </div>
      </section>
      <MouseTiltCard
        className="card-enter mt-6 rounded-xl border border-white/10 bg-black/40 px-6 py-4 text-sm text-zinc-300"
        style={{ "--enter-delay": "70ms" } as CSSProperties}
      >
        Member views will appear here: assigned processes, activities, and progress.
      </MouseTiltCard>
      <section
        className="card-enter mt-6 rounded-2xl border border-white/10 bg-black/35 p-6"
        style={{ "--enter-delay": "120ms" } as CSSProperties}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Team</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Company members</h2>
          </div>
          <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-zinc-300">
            {members.length} members
          </span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => {
            const initial = member.user.email.trim().charAt(0).toUpperCase() || "?";
            return (
              <div
                key={member.id}
                className="landing-glass rounded-xl border border-white/10 p-4"
              >
                <div className="flex items-center gap-3">
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
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
