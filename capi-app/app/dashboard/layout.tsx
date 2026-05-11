import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { clearSessionCookie, getCurrentSession } from "@/lib/auth";
import { BackToHomeLink } from "@/components/dashboard/back-to-home-link";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await getCurrentSession();
  if (!session) {
    await clearSessionCookie();
    redirect("/auth/login");
  }

  const role = session.activeWorkspaceRole;
  const hasWorkspace = typeof session.activeWorkspaceId === "number";

  return (
    <div className="landing-root min-h-screen">
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-black/60 px-6 py-4 backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-6">
          <h2 className="text-lg font-semibold text-white">CAPI</h2>
          <DashboardNav hasWorkspace={hasWorkspace} role={role} />
        </div>
        <BackToHomeLink />
      </header>
      {children}
    </div>
  );
}
