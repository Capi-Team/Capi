import Link from "next/link";

export function BackToHomeLink() {
  return (
    <Link
      href="/"
      className="rounded-lg border border-[var(--coffee-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--coffee-dark)] shadow-sm transition-colors hover:bg-[var(--coffee-cream)]"
    >
      Back to home
    </Link>
  );
}
