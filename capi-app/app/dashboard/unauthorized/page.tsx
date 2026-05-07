import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-8">
      <div className="max-w-sm text-center">
        <div className="mb-4 text-5xl">🚫</div>
        <h1 className="mb-2 text-2xl font-bold text-[var(--coffee-dark)]">Access denied</h1>
        <p className="mb-6 text-[var(--coffee-muted)]">
          You do not have permission to view this page.
        </p>
        <Link
          href="/dashboard"
          className="inline-block rounded-lg bg-[var(--coffee-dark)] px-5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Back to workspace hub
        </Link>
      </div>
    </div>
  );
}
