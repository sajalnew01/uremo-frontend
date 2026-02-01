"use client";

import Card from "@/components/Card";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import PageHeader from "@/components/ui/PageHeader";
import { useState, useEffect } from "react";

const INTEREST_OPTIONS = ["microjobs", "forex", "wallets", "crypto", "rentals"];

export default function ProfilePage() {
  const { user, isAuthenticated, ready } = useAuth();
  const { toast } = useToast();
  const [emailPreferences, setEmailPreferences] = useState({
    productUpdates: true,
    jobAlerts: true,
    dealAlerts: true,
    rentalAlerts: true,
    marketing: false,
  });
  const [interestTags, setInterestTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  const email = String(user?.email || "").trim();
  const role = String(user?.role || "user").trim();
  const createdAt = (user as any)?.createdAt
    ? new Date((user as any).createdAt)
    : null;

  // Load preferences on mount
  useEffect(() => {
    if (isAuthenticated && !prefsLoaded) {
      loadPreferences();
    }
  }, [isAuthenticated, prefsLoaded]);

  const loadPreferences = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://uremo-backend.onrender.com"}/api/users/preferences`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setEmailPreferences(data.data.emailPreferences);
          setInterestTags(data.data.interestTags);
          setPrefsLoaded(true);
        }
      }
    } catch (error) {
      console.error("Failed to load preferences:", error);
    }
  };

  const copyEmail = async () => {
    if (!email) return;
    try {
      await navigator.clipboard.writeText(email);
      toast("Email copied", "success");
    } catch {
      toast("Failed to copy", "error");
    }
  };

  const toggleEmailPreference = (key: keyof typeof emailPreferences) => {
    if (
      ![
        "productUpdates",
        "jobAlerts",
        "dealAlerts",
        "rentalAlerts",
        "marketing",
      ].includes(key)
    ) {
      console.error(`Invalid preference key: ${key}`);
      return;
    }

    setEmailPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleInterest = (tag: string) => {
    const VALID_INTERESTS = [
      "microjobs",
      "forex",
      "wallets",
      "crypto",
      "rentals",
    ];
    if (!VALID_INTERESTS.includes(tag)) {
      console.error(`Invalid interest tag: ${tag}`);
      return;
    }
    if (interestTags.length >= 10 && !interestTags.includes(tag)) {
      toast("Maximum 10 interests allowed", "error");
      return;
    }

    setInterestTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const savePreferences = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast("Not authenticated", "error");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://uremo-backend.onrender.com"}/api/users/preferences`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            emailPreferences,
            interestTags,
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast("Preferences updated successfully", "success");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast(errorData.message || "Failed to update preferences", "error");
      }
    } catch (error) {
      console.error("Error saving preferences:", error);
      toast("Error saving preferences", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return <div className="u-container text-sm text-[#9CA3AF]">Loading…</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="u-container">
        <Card title="Profile">
          <p className="text-sm text-[#9CA3AF]">You're not logged in.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="u-container space-y-6">
      <PageHeader
        title="Profile"
        description="Manage your account settings and information"
      />

      <Card>
        <div className="space-y-4">
          <div>
            <p className="text-xs tracking-widest text-slate-300">EMAIL</p>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <p className="text-slate-100 font-medium break-all">
                {email || "—"}
              </p>
              {email && (
                <button
                  type="button"
                  onClick={copyEmail}
                  className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs text-slate-200 hover:bg-white/10"
                >
                  Copy email
                </button>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs tracking-widest text-slate-300">ROLE</p>
            <p className="mt-1 text-slate-100 font-medium capitalize">{role}</p>
          </div>

          <div>
            <p className="text-xs tracking-widest text-slate-300">CREATED</p>
            <p className="mt-1 text-slate-100 font-medium">
              {createdAt ? createdAt.toLocaleString() : "—"}
            </p>
            <p className="mt-1 text-xs text-[#9CA3AF]">
              Created date appears if your session includes it.
            </p>
          </div>
        </div>
      </Card>

      {/* PATCH_53: Email Preferences */}
      <Card title="Email Preferences">
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-200 mb-3">
              Notification Types
            </p>
            <div className="space-y-2">
              {(
                [
                  { key: "productUpdates", label: "Product Updates" },
                  { key: "jobAlerts", label: "Job Alerts" },
                  { key: "dealAlerts", label: "Deal Alerts" },
                  { key: "rentalAlerts", label: "Rental Alerts" },
                  { key: "marketing", label: "Marketing Emails" },
                ] as const
              ).map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={emailPreferences[key]}
                    onChange={() => toggleEmailPreference(key)}
                    className="w-4 h-4 rounded border-slate-500 bg-slate-700"
                  />
                  <span className="text-sm text-slate-300">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700">
            <p className="text-sm font-medium text-slate-200 mb-3">
              Your Interests
            </p>
            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleInterest(tag)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    interestTags.includes(tag)
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-400">
              Select topics you're interested in to receive relevant updates
            </p>
          </div>

          <div className="pt-4">
            <button
              onClick={savePreferences}
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
            >
              {loading ? "Saving..." : "Save Preferences"}
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
