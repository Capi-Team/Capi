import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { clearSessionCookie, getCurrentSession } from "@/lib/auth";
import LogoutButton from "@/app/dashboard/logout-button";

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
    <div className="min-h-screen bg-[var(--coffee-cream)]">
      <header className="flex items-center justify-between border-b border-[var(--coffee-border)] bg-[var(--coffee-cream)]/90 px-6 py-4 backdrop-blur-sm">
        <h2 className="text-lg font-semibold text-[var(--coffee-dark)]">Dashboard</h2>
        <LogoutButton />
      </header>
      {children}
    </div>
  );
}
