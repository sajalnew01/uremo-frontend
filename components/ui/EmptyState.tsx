"use client";

/**
 * PATCH_34: Reusable Empty State Component
 * Displays a friendly message with CTA when no data is available
 */

import Link from "next/link";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  ctaText?: string;
  ctaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  ctaText,
  ctaHref,
  secondaryCtaText,
  secondaryCtaHref,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-16 px-6 text-center"
    >
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500/10 to-emerald-500/10 border border-white/10 flex items-center justify-center mb-6">
        <span className="text-5xl">{icon}</span>
      </div>

      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-slate-400 max-w-md mb-6">{description}</p>

      <div className="flex flex-wrap gap-3 justify-center">
        {ctaText && ctaHref && (
          <Link
            href={ctaHref}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium text-sm hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/20"
          >
            {ctaText}
          </Link>
        )}

        {secondaryCtaText && secondaryCtaHref && (
          <Link
            href={secondaryCtaHref}
            className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-200 font-medium text-sm hover:bg-white/10 transition-all"
          >
            {secondaryCtaText}
          </Link>
        )}
      </div>
    </motion.div>
  );
}
