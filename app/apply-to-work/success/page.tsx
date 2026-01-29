"use client";

/**
 * PATCH_40: Apply-to-Work Success Confirmation Page
 * Displays application confirmation with next steps
 */

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

function ApplyToWorkSuccessContent() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("id");
  const serviceTitle = searchParams.get("title");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="u-container max-w-2xl py-16"
    >
      <div className="card text-center">
        {/* Success Icon */}
        <div className="mx-auto w-24 h-24 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6">
          <span className="text-5xl">📩</span>
        </div>

        <h1 className="text-3xl font-bold text-white mb-2">
          Application Submitted!
        </h1>

        <p className="text-lg text-emerald-400 font-medium mb-4">
          Your work application has been received
        </p>

        {/* Application Reference */}
        {applicationId && (
          <div className="inline-block rounded-xl bg-white/5 border border-white/10 px-6 py-3 mb-6">
            <p className="text-xs text-slate-400 uppercase tracking-wide">
              Reference ID
            </p>
            <p className="text-lg font-mono text-white mt-1">
              #{applicationId.slice(-8).toUpperCase()}
            </p>
          </div>
        )}

        {/* Service Applied To */}
        {serviceTitle && (
          <div className="rounded-xl bg-white/5 border border-white/10 p-4 mb-6">
            <p className="text-sm text-slate-400">Applied to work on</p>
            <p className="text-lg text-white font-medium mt-1">
              {decodeURIComponent(serviceTitle)}
            </p>
          </div>
        )}

        {/* What's Next */}
        <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-6 mb-6 text-left">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <span>🔍</span> What Happens Next
          </h3>
          <ol className="space-y-3 text-sm text-slate-200">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">
                1
              </span>
              <span>Admin reviews your application and qualifications</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">
                2
              </span>
              <span>If approved, you'll receive work assignments</span>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs font-bold">
                3
              </span>
              <span>Complete tasks and earn money to your wallet</span>
            </li>
          </ol>
        </div>

        {/* Expected Timeline */}
        <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 mb-6">
          <p className="text-sm text-blue-300">
            <span className="font-semibold">⏱️ Typical Response Time:</span>{" "}
            Applications are usually reviewed within 24-48 hours
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/explore-services" className="btn-primary">
            Browse More Jobs
          </Link>
          <Link href="/workspace" className="btn-secondary">
            View My Workspace
          </Link>
        </div>

        {/* Tips */}
        <div className="mt-8 text-left rounded-xl bg-amber-500/10 border border-amber-500/20 p-4">
          <h4 className="text-sm font-semibold text-amber-300 mb-2">
            💡 Pro Tips
          </h4>
          <ul className="text-xs text-slate-300 space-y-1">
            <li>• Complete your profile to increase approval chances</li>
            <li>• Apply to multiple services to maximize opportunities</li>
            <li>• Check your workspace regularly for updates</li>
          </ul>
        </div>

        {/* Help */}
        <p className="mt-6 text-xs text-slate-500">
          Questions? Contact support for assistance with your application.
        </p>
      </div>
    </motion.div>
  );
}

export default function ApplyToWorkSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="u-container max-w-2xl py-16">
          <div className="card text-center">
            <div className="h-24 w-24 mx-auto rounded-full bg-white/5 animate-pulse" />
            <div className="mt-6 h-8 w-48 mx-auto rounded bg-white/5 animate-pulse" />
          </div>
        </div>
      }
    >
      <ApplyToWorkSuccessContent />
    </Suspense>
  );
}
