"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { useAuthStore } from "@/store";
import { emitToast } from "@/hooks/useToast";
import Link from "next/link";
import type { User } from "@/types";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoggedIn, hydrate } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (isLoggedIn) {
      const next = searchParams.get("next") || "/dashboard";
      router.replace(next);
    }
  }, [isLoggedIn, router, searchParams]);

  const mutation = useMutation({
    mutationFn: () =>
      apiRequest<{ token: string; user: User }>(EP.AUTH_LOGIN, "POST", { email, password }),
    onSuccess: (data) => {
      login(data.token, data.user);
      emitToast("Welcome back!", "success");
      const next = searchParams.get("next") || "/dashboard";
      router.push(next);
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      emitToast("Please fill in all fields", "error");
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Welcome Back</h1>
        <p className="auth-subtitle">Sign in to your UREMO account</p>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="u-label">Email</label>
            <input
              className="u-input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="auth-field">
            <label className="u-label">Password</label>
            <input
              className="u-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <div style={{ textAlign: "right", marginBottom: "var(--space-4)" }}>
            <Link href="/forgot-password" style={{ fontSize: "var(--text-sm)", color: "var(--color-brand)" }}>
              Forgot password?
            </Link>
          </div>
          <button
            type="submit"
            className="u-btn u-btn-primary u-btn-lg"
            disabled={mutation.isPending}
            style={{ width: "100%" }}
          >
            {mutation.isPending ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="auth-footer">
          Don&apos;t have an account?{" "}
          <Link href="/signup">Sign up</Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}
