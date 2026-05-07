import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">🚫</div>
        <h1 className="text-2xl font-bold text-[var(--coffee-dark)] mb-2">Acceso denegado</h1>
        <p className="text-[var(--coffee-muted)] mb-6">
          No tienes los permisos necesarios para ver esta página.
        </p>
        <Link
          href="/dashboard"
          className="inline-block rounded-lg bg-[var(--coffee-dark)] px-5 py-2.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
