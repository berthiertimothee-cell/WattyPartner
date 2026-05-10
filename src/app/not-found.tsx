import Link from "next/link";
import { Logo } from "@/components/layout/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <Logo size={44} />
      <div>
        <h1 className="text-xl font-semibold text-ink">Page not found</h1>
        <p className="mt-1 text-sm text-muted">The page you’re looking for doesn’t exist or has moved.</p>
      </div>
      <Link href="/dashboard" className="btn-primary">
        Back to dashboard
      </Link>
    </div>
  );
}
