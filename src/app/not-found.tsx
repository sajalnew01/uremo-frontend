export default function NotFound() {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
      <div className="text-sm font-semibold">Not Found</div>
      <div className="mt-1 text-sm text-[var(--muted)]">
        The requested route does not exist.
      </div>
    </div>
  );
}
