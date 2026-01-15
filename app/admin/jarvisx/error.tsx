"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function JarvisXError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[JARVISX_PAGE_ERROR]", error);
  }, [error]);

  return (
    <div className="max-w-2xl py-8">
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
        <p className="text-xs uppercase tracking-wider text-red-300 font-semibold">
          JarvisX Error
        </p>
        <h1 className="text-2xl font-bold text-white mt-2">
          Command Center Unavailable
        </h1>
        <p className="text-slate-300 mt-3">
          JarvisX encountered an error loading this page. This may be due to a
          temporary backend issue or network problem.
        </p>

        {process.env.NODE_ENV !== "production" && error?.message && (
          <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-3">
            <p className="text-xs text-slate-400 font-mono break-all">
              {error.message}
            </p>
          </div>
        )}

        <div className="mt-6 flex gap-3 flex-wrap">
          <button
            onClick={reset}
            className="rounded-2xl px-4 py-3 text-sm font-semibold border border-white/10 bg-white/10 hover:bg-white/15 text-white transition"
          >
            Try again
          </button>
          <Link
            href="/admin"
            className="rounded-2xl px-4 py-3 text-sm font-semibold border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 transition"
          >
            Back to Admin
          </Link>
        </div>
      </div>
    </div>
  );
}
