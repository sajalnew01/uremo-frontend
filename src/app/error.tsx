"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="u-page-center">
      <h2 className="u-heading-2">Something went wrong</h2>
      <p className="u-text-secondary">{error.message}</p>
      <button className="u-btn u-btn-primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
