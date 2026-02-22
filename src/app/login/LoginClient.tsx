"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { EP } from "@/lib/api/endpoints";
import { useAuthStore } from "@/store";

function normalizeSessionUser(input: any, emailHint: string) {
  const u = input && typeof input === "object" ? input : {};
  const email = typeof u.email === "string" ? u.email : emailHint;
  const role = u.role === "admin" ? "admin" : "user";
  const id =
    typeof u._id === "string"
      ? u._id
      : typeof u.id === "string"
        ? u.id
        : undefined;
  const name =
    typeof u.name === "string" && u.name.trim()
      ? u.name
      : email?.split("@")[0] || "User";

  return {
    ...u,
    _id: id,
    id,
    email,
    role,
    name,
  };
}

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/marketplace";

  const login = useAuthStore((s) => s.login);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiRequest<{ token: string; user: any }>(
        EP.AUTH_LOGIN,
        "POST",
        { email, password },
        false,
      );

      const normalized = normalizeSessionUser(res.user, email);
      login(res.token, normalized);
      router.replace(next);
    } catch (err: any) {
      setError(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6">
        <div className="text-lg font-semibold">Sign in</div>
        <div className="mt-1 text-sm text-[var(--muted)]">
          Enterprise access requires authentication.
        </div>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <label className="block">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Email
            </div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none"
              autoComplete="email"
              required
            />
          </label>

          <label className="block">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              Password
            </div>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none"
              autoComplete="current-password"
              required
            />
          </label>

          {error ? (
            <div className="rounded-xl border border-[var(--border)] bg-[rgba(239,68,68,0.12)] px-3 py-2 text-sm">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-sm font-semibold disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
