"use client";

import { useRequireAuth } from "@/hooks/useAuth";

export default function AccountPage() {
  const ok = useRequireAuth();
  if (!ok) return null;

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
      <div className="text-sm font-semibold">Account</div>
      <div className="mt-1 text-sm text-[var(--muted)]">
        Profile, onboarding, and notifications entry points will be rebuilt
        here.
      </div>
    </div>
  );
}
