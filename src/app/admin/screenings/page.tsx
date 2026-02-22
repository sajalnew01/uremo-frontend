"use client";

import { useRequireAdmin } from "@/hooks/useAuth";

export default function AdminScreeningsPage() {
  const ok = useRequireAdmin();
  if (!ok) return null;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
      <div className="text-sm font-semibold">Admin Screenings</div>
      <div className="mt-1 text-sm text-[var(--muted)]">
        Clone screenings and review submissions will be rebuilt here.
      </div>
    </div>
  );
}
