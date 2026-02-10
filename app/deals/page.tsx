"use client";

import Link from "next/link";
import PageHeader from "@/components/ui/PageHeader";

/**
 * PATCH_92: Deals page replaced with Coming Soon banner.
 * Deals are not ready — no API calls, no broken checkout, no console errors.
 */
export default function DealsPage() {
  return (
    <div className="u-container max-w-6xl">
      <PageHeader
        title="Deals"
        description="Exclusive deals on premium services"
        actionLabel="Explore Services"
        actionHref="/explore-services"
      />

      {/* Coming Soon Banner */}
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 via-slate-900/50 to-orange-500/5 p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4">
          <span className="text-3xl">🚧</span>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          Deals Are Coming Soon
        </h2>

        <p className="text-slate-300 max-w-md mx-auto mb-6">
          This feature is under development. We&apos;re building a powerful
          deals engine to help you save more on premium services.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/explore-services" className="btn-primary">
            Explore Services
          </Link>
          <Link href="/explore-services?intent=rent" className="btn-secondary">
            Browse Rentals
          </Link>
        </div>
      </div>
    </div>
  );
}
