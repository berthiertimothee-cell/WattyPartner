import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="text-sm font-semibold uppercase tracking-wide text-brand-600">404</div>
      <h1 className="mt-2 text-2xl font-semibold text-ink">Page not found</h1>
      <p className="mt-1 text-sm text-muted">The page or resource you’re looking for doesn’t exist.</p>
      <Link href="/dashboard" className="btn-primary mt-5">Back to dashboard</Link>
    </div>
  );
}
