"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { WorkspaceRole } from "@prisma/client";

type DashboardNavProps = {
  hasWorkspace: boolean;
  role: WorkspaceRole | null | undefined;
};

/**
 * En el hub (`/dashboard`) solo mostramos Hub: aún no hay contexto de espacio de trabajo.
 * Dentro de rutas de dashboard ya tiene sentido Asistente IA, recursos, etc.
 */
export function DashboardNav({ hasWorkspace, role }: DashboardNavProps) {
  const pathname = usePathname();
  const isHub = pathname === "/dashboard";

  if (isHub) {
    return (
      <nav className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
        <Link href="/dashboard" className="font-medium text-white transition-colors hover:text-white">
          Hub
        </Link>
      </nav>
    );
  }

  return (
    <nav className="flex flex-wrap items-center gap-4 text-sm text-zinc-400">
      <Link href="/dashboard" className="transition-colors hover:text-white">
        Hub
      </Link>
      {hasWorkspace ? (
        <Link href="/dashboard/workspace" className="transition-colors hover:text-white">
          AI Assistant
        </Link>
      ) : null}
      {hasWorkspace ? (
        <Link href="/dashboard/resources" className="transition-colors hover:text-white">
          Resources
        </Link>
      ) : null}
      {hasWorkspace && role === "OWNER" ? (
        <Link href="/dashboard/owner" className="transition-colors hover:text-white">
          Panel owner
        </Link>
      ) : null}
      {hasWorkspace && (role === "MEMBER" || role === "ADMIN" || role === "OWNER") ? (
        <Link href="/dashboard/member" className="transition-colors hover:text-white">
          Team Area
        </Link>
      ) : null}
    </nav>
  );
}
