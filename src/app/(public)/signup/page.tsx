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

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoggedIn, hydrate } = useAuthStore();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => { hydrate(); }, [hydrate]);
  useEffect(() => {
    if (isLoggedIn) router.replace("/dashboard");
  }, [isLoggedIn, router]);

  const mutation = useMutation({
    mutationFn: () => {
      const ref = searchParams.get("ref") || undefined;
      return apiRequest<{ token: string; user: User }>(EP.AUTH_SIGNUP, "POST", {
        name,
        email,
        password,
        ...(ref ? { referralCode: ref } : {}),
      });
    },
    onSuccess: (data) => {
      login(data.token, data.user);
      emitToast("Account created! Welcome to UREMO.", "success");
      router.push("/dashboard");
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      emitToast("Please fill in all fields", "error");
      return;
    }
    if (password !== confirmPassword) {
      emitToast("Passwords don't match", "error");
      return;
    }
    if (password.length < 6) {
      emitToast("Password must be at least 6 characters", "error");
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Create Account</h1>
        <p className="auth-subtitle">Join UREMO and start exploring</p>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="u-label">Full Name</label>
            <input
              className="u-input"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>
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
              placeholder="Min 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <div className="auth-field">
            <label className="u-label">Confirm Password</label>
            <input
              className="u-input"
              type="password"
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            className="u-btn u-btn-primary u-btn-lg"
            disabled={mutation.isPending}
            style={{ width: "100%", marginTop: "var(--space-2)" }}
          >
            {mutation.isPending ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account?{" "}
          <Link href="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
