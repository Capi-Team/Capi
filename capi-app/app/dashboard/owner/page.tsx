import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/auth";

export default async function OwnerDashboardPage() {
  const session = await getCurrentSession();
  if (!session) redirect("/auth/login");
  if (session.activeWorkspaceRole !== "OWNER") redirect("/dashboard/unauthorized");

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-[var(--coffee-dark)] mb-2">Dashboard del Propietario</h1>
      <p className="text-[var(--coffee-muted)] mb-6">
        Bienvenido, <span className="font-semibold text-[var(--coffee-ink)]">{session.email}</span>.
        Tienes acceso como <span className="font-semibold text-amber-700">OWNER</span> en este entorno.
      </p>
      <div className="rounded-xl border border-[var(--coffee-border)] bg-amber-50 px-6 py-4 text-amber-900 text-sm">
        Aquí irán las funcionalidades exclusivas del propietario: gestión de miembros, configuración del entorno, etc.
      </div>
    </div>
  );
}
