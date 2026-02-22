import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-lg">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6">
            <div className="text-sm text-[var(--muted)]">Loading...</div>
          </div>
        </div>
      }
    >
      <LoginClient />
    </Suspense>
  );
}
