import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { clearSessionCookie, getCurrentSession } from "@/lib/auth";
import { BackToHomeLink } from "@/components/dashboard/back-to-home-link";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await getCurrentSession();
  if (!session) {
    await clearSessionCookie();
    redirect("/auth/login");
  }

  return (
    <div className="landing-root min-h-screen">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-black/60 px-6 py-4 backdrop-blur-xl">
        <h2 className="text-lg font-semibold text-white">App</h2>
        <BackToHomeLink />
      </header>
      {children}
    </div>
  );
}
