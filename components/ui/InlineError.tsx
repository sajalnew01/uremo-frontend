"use client";

interface InlineErrorProps {
  title: string;
  message: string;
  onRetry?: () => void;
}

export default function InlineError({
  title,
  message,
  onRetry,
}: InlineErrorProps) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
      <p className="font-semibold text-red-100">{title}</p>
      <p className="text-sm text-red-200/90 mt-1">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 inline-flex items-center justify-center rounded-lg bg-red-500/20 px-3 py-2 text-sm hover:bg-red-500/25 transition"
        >
          Retry
        </button>
      )}
    </div>
  );
}
