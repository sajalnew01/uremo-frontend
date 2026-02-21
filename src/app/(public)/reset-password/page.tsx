"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { emitToast } from "@/hooks/useToast";
import Link from "next/link";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      apiRequest(EP.AUTH_RESET_PASSWORD, "POST", { token, password }),
    onSuccess: () => {
      emitToast("Password reset successful! Please sign in.", "success");
      router.push("/login");
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      emitToast("Invalid or missing reset token", "error");
      return;
    }
    if (password.length < 6) {
      emitToast("Password must be at least 6 characters", "error");
      return;
    }
    if (password !== confirmPassword) {
      emitToast("Passwords don't match", "error");
      return;
    }
    mutation.mutate();
  };

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: "center" }}>
          <h1 className="auth-title">Invalid Link</h1>
          <p className="auth-subtitle">This password reset link is invalid or has expired.</p>
          <Link href="/forgot-password" className="u-btn u-btn-primary" style={{ marginTop: "var(--space-4)" }}>
            Request New Link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">New Password</h1>
        <p className="auth-subtitle">Choose a new password for your account.</p>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="u-label">New Password</label>
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
            <label className="u-label">Confirm New Password</label>
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
            style={{ width: "100%" }}
          >
            {mutation.isPending ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <div className="auth-footer">
          <Link href="/login">← Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="auth-page"><div className="auth-card"><p>Loading...</p></div></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
