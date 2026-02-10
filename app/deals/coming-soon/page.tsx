"use client";

import Link from "next/link";

export default function DealsComingSoonPage() {
  return (
    <div className="u-container max-w-3xl text-center py-20">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 mb-6">
        <span className="text-4xl">🚧</span>
      </div>

      <h1 className="text-3xl font-bold text-white mb-3">
        Deals Are Coming Soon
      </h1>

      <p className="text-slate-300 text-lg mb-2 max-w-lg mx-auto">
        This feature is under development. We&apos;re building a powerful deals
        engine to help you save more on premium services.
      </p>

      <p className="text-sm text-slate-400 mb-8">
        Stay tuned — deals will be available in an upcoming release.
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
  );
}
