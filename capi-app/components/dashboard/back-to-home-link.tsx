import Link from "next/link";

export function BackToHomeLink() {
  return (
    <Link
      href="/"
      className="landing-btn-muted rounded-full px-5 py-2 text-sm font-semibold"
    >
      Back to home
    </Link>
  );
}
