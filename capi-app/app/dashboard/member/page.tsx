import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { MouseTiltCard } from "@/components/ui/mouse-tilt-card";

export default async function MemberDashboardPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/auth/login");
  if (session.activeWorkspaceRole !== "MEMBER" && session.activeWorkspaceRole !== "OWNER") {
    redirect("/dashboard/unauthorized");
  }

  return (
    <div className="p-8">
      <section className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-[radial-gradient(circle_at_15%_15%,#1f1f1f_0%,#101010_45%,#080808_100%)] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Member panel</p>
        <h1 className="mt-2 text-4xl font-semibold leading-tight text-white">
          Focused
          <br />
          workflow.
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-zinc-300 sm:text-base">
          Hello, <span className="font-semibold text-zinc-100">{session.email}</span>.
          You have <span className="font-semibold text-zinc-100">MEMBER</span> access in this
          workspace.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
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
      <MouseTiltCard className="mt-6 rounded-xl border border-white/10 bg-black/40 px-6 py-4 text-sm text-zinc-300">
        Member views will appear here: assigned processes, activities, and progress.
      </MouseTiltCard>
    </div>
  );
}
