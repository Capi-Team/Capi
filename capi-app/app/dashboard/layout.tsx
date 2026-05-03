import type { ReactNode } from "react";
import LogoutButton from "@/app/dashboard/logout-button";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-[#2f3d5f]">Dashboard</h2>
        <LogoutButton />
      </header>
      {children}
    </div>
  );
}
