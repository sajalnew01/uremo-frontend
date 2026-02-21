"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { emitToast } from "@/hooks/useToast";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      apiRequest(EP.AUTH_FORGOT_PASSWORD, "POST", { email }),
    onSuccess: () => {
      setSent(true);
      emitToast("Reset link sent! Check your email.", "success");
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      emitToast("Please enter your email", "error");
      return;
    }
    mutation.mutate();
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Reset Password</h1>
        <p className="auth-subtitle">
          {sent
            ? "Check your email for the reset link."
            : "Enter your email to receive a password reset link."}
        </p>

        {!sent ? (
          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="u-label">Email</label>
              <input
                className="u-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="u-btn u-btn-primary u-btn-lg"
              disabled={mutation.isPending}
              style={{ width: "100%" }}
            >
              {mutation.isPending ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: "center", padding: "var(--space-4) 0" }}>
            <p style={{ fontSize: "var(--text-sm)", color: "var(--color-success)", marginBottom: "var(--space-4)" }}>
              ✓ Email sent to {email}
            </p>
            <button className="u-btn u-btn-secondary" onClick={() => setSent(false)}>
              Try another email
            </button>
          </div>
        )}

        <div className="auth-footer">
          <Link href="/login">← Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}
