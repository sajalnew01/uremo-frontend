"use client";

/**
 * PATCH_52: Unified Page Header Component
 * Standard header used on every major page for consistency
 */

import Link from "next/link";

interface PageHeaderProps {
  title: string;
  description?: string;
  emoji?: React.ReactNode;
  actionLabel?: string;
  actionHref?: string;
  actionOnClick?: () => void;
}

export default function PageHeader({
  title,
  description,
  emoji,
  actionLabel,
  actionHref,
  actionOnClick,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
          {emoji && <span className="text-2xl sm:text-3xl">{emoji}</span>}
          {title}
        </h1>
        {description && (
          <p className="text-slate-400 mt-1 text-sm sm:text-base">
            {description}
          </p>
        )}
      </div>

      {actionLabel && (actionHref || actionOnClick) && (
        <>
          {actionHref ? (
            <Link
              href={actionHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium text-sm hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/20 whitespace-nowrap"
            >
              {actionLabel}
            </Link>
          ) : (
            <button
              onClick={actionOnClick}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-medium text-sm hover:from-blue-500 hover:to-blue-400 transition-all shadow-lg shadow-blue-500/20 whitespace-nowrap"
            >
              {actionLabel}
            </button>
          )}
        </>
      )}
    </div>
  );
}
