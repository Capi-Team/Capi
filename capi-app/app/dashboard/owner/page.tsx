import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";

export default async function OwnerDashboardPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/auth/login");
  if (session.activeWorkspaceRole !== "OWNER") redirect("/dashboard/unauthorized");

  return (
    <div className="p-8">
      <h1 className="mb-2 text-2xl font-bold text-[var(--coffee-dark)]">Owner dashboard</h1>
      <p className="mb-6 text-[var(--coffee-muted)]">
        Hello, <span className="font-semibold text-[var(--coffee-ink)]">{session.email}</span>.
        You have <span className="font-semibold text-amber-700">OWNER</span> access in this
        workspace.
      </p>
      <div className="rounded-xl border border-[var(--coffee-border)] bg-amber-50 px-6 py-4 text-sm text-amber-900">
        Owner-only tools will live here: member management, workspace settings, and more.
      </div>
    </div>
  );
}
