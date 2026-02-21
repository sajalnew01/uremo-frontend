"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { useRequireAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store";
import { emitToast } from "@/hooks/useToast";
import type { User } from "@/types";

export default function ProfilePage() {
  const ready = useRequireAuth();
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");

  const { data: profileData } = useQuery<{ user: User }>({
    queryKey: ["profile"],
    queryFn: () => apiRequest(EP.AUTH_ME, "GET", undefined, true),
    enabled: ready,
  });

  useEffect(() => {
    if (profileData?.user) {
      setName(profileData.user.name || "");
      setPhone(profileData.user.phone || "");
      setCountry(profileData.user.country || "");
    }
  }, [profileData]);

  const updateMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ user: User }>(EP.AUTH_PROFILE, "PUT", { name, phone, country }, true),
    onSuccess: (data) => {
      setUser(data.user);
      emitToast("Profile updated!", "success");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  if (!ready) return null;

  return (
    <div className="page-content">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your account settings.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-6)" }}>
        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="u-card">
          <h3 className="u-heading-3" style={{ marginBottom: "var(--space-4)" }}>Personal Information</h3>
          <div className="auth-field">
            <label className="u-label">Full Name</label>
            <input className="u-input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="auth-field">
            <label className="u-label">Email</label>
            <input className="u-input" value={user?.email || ""} disabled style={{ opacity: 0.5 }} />
          </div>
          <div className="auth-field">
            <label className="u-label">Phone</label>
            <input className="u-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" />
          </div>
          <div className="auth-field">
            <label className="u-label">Country</label>
            <input className="u-input" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Optional" />
          </div>
          <button
            type="submit"
            className="u-btn u-btn-primary"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </form>

        {/* Account Info */}
        <div>
          <div className="u-card" style={{ marginBottom: "var(--space-4)" }}>
            <h3 className="u-heading-3" style={{ marginBottom: "var(--space-4)" }}>Account</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", fontSize: "var(--text-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-tertiary)" }}>Role</span>
                <span style={{ textTransform: "capitalize" }}>{user?.role}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-tertiary)" }}>Joined</span>
                <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-tertiary)" }}>Referral Code</span>
                <span style={{ fontFamily: "var(--font-mono)" }}>{user?.referralCode || "—"}</span>
              </div>
            </div>
          </div>

          <div className="u-card">
            <h3 className="u-heading-3" style={{ marginBottom: "var(--space-4)" }}>Affiliate</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", fontSize: "var(--text-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--color-text-tertiary)" }}>Affiliate Balance</span>
                <span style={{ color: "var(--color-success)" }}>${user?.affiliateBalance?.toFixed(2) || "0.00"}</span>
              </div>
              <p style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
                Share your referral code to earn commissions on purchases.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
