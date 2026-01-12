"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the real error for monitoring / debugging
    console.error(error);
  }, [error]);

  const isDev = process.env.NODE_ENV !== "production";

  return (
    <div className="u-container max-w-2xl py-20">
      <div className="card">
        <p className="text-sm text-[#9CA3AF]">Error</p>
        <h1 className="text-3xl font-bold text-white mt-2">
          Something went wrong
        </h1>
        <p className="text-slate-300 mt-3">
          An unexpected error occurred. Please try again or go back to the home
          page.
        </p>

        {isDev && (error?.message || error?.digest) && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
            {error?.digest && (
              <p className="text-xs text-[#9CA3AF] font-mono">
                digest: {error.digest}
              </p>
            )}
            {error?.message && (
              <p className="text-xs text-[#9CA3AF] font-mono">
                {error.message}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex gap-3 flex-wrap">
          <button onClick={reset} className="btn-primary">
            Try again
          </button>
          <Link href="/" className="btn-secondary">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
