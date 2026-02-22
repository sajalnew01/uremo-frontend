"use client";

import { useRequireAdmin } from "@/hooks/useAuth";

export default function AdminUsersPage() {
  const ok = useRequireAdmin();
  if (!ok) return null;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
      <div className="text-sm font-semibold">Admin Users</div>
      <div className="mt-1 text-sm text-[var(--muted)]">
        User management grid will be rebuilt here.
      </div>
    </div>
  );
}
