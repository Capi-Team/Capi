import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";
import { MouseTiltCard } from "@/components/ui/mouse-tilt-card";

export default async function OwnerDashboardPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/auth/login");
  if (session.activeWorkspaceRole !== "OWNER") redirect("/dashboard/unauthorized");

  return (
    <div className="p-8">
      <section className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-[radial-gradient(circle_at_15%_15%,#212121_0%,#111111_45%,#080808_100%)] p-8 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
        <p className="text-xs uppercase tracking-[0.24em] text-zinc-400">Owner panel</p>
        <h1 className="mt-2 text-4xl font-semibold leading-tight text-white">
          Advanced
          <br />
          control center.
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-zinc-300 sm:text-base">
          Hello, <span className="font-semibold text-zinc-100">{session.email}</span>.
          You have <span className="font-semibold text-zinc-100">OWNER</span> access in this
          workspace.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <MouseTiltCard className="landing-glass rounded-xl p-4 text-sm text-zinc-100">
            Member management
          </MouseTiltCard>
          <MouseTiltCard className="landing-glass rounded-xl p-4 text-sm text-zinc-100">
            Access rules
          </MouseTiltCard>
          <MouseTiltCard className="landing-glass rounded-xl p-4 text-sm text-zinc-100">
            Workspace settings
          </MouseTiltCard>
        </div>
      </section>
      <MouseTiltCard className="mt-6 rounded-xl border border-white/10 bg-black/40 px-6 py-4 text-sm text-zinc-300">
        Owner-only tools will live here: member management, workspace settings, and more.
      </MouseTiltCard>
    </div>
  );
}
