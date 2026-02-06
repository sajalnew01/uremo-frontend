"use client";

/**
 * DEPRECATED COMPATIBILITY ROUTE (Phase 4)
 *
 * Kept for backwards-compatible links/bookmarks.
 * Canonical destination: `/explore-services`.
 *
 * Do not create new links to `/buy-service`.
 */

// PATCH_38: Redirect old /buy-service to /explore-services
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function BuyServiceRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/explore-services");
  }, [router]);

  return (
    <div className="u-container flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-white/20 border-t-blue-500 rounded-full mx-auto mb-4" />
        <p className="text-slate-300">Redirecting to services...</p>
      </div>
    </div>
  );
}
