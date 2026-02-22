"use client";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
      <div className="text-sm font-semibold">Runtime Error</div>
      <div className="mt-1 text-sm text-[var(--muted)]">{error.message}</div>
      {error.digest ? (
        <div className="mt-2 text-xs text-[var(--muted)] mono">
          {error.digest}
        </div>
      ) : null}
    </div>
  );
}
