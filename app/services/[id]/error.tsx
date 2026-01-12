"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ServiceDetailsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Service details error:", error);
  }, [error]);

  return (
    <div className="u-container max-w-2xl py-20">
      <div className="card">
        <p className="text-sm text-[#9CA3AF]">Error</p>
        <h1 className="text-2xl font-bold text-white mt-2">
          Service unavailable
        </h1>
        <p className="text-slate-300 mt-3">
          We couldn't load this service. It may have been removed or you may not
          have permission to view it.
        </p>

        <div className="mt-6 flex gap-3 flex-wrap">
          <button onClick={reset} className="btn-primary">
            Retry
          </button>
          <Link href="/buy-service" className="btn-secondary">
            Back to services
          </Link>
          <Link href="/" className="btn-secondary">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
