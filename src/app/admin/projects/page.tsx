"use client";

import { useRequireAdmin } from "@/hooks/useAuth";

export default function AdminProjectsPage() {
  const ok = useRequireAdmin();
  if (!ok) return null;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
      <div className="text-sm font-semibold">Admin Projects</div>
      <div className="mt-1 text-sm text-[var(--muted)]">
        Project assignment + crediting will be rebuilt here.
      </div>
    </div>
  );
}
