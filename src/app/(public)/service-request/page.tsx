"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { emitToast } from "@/hooks/useToast";

const URGENCY_OPTIONS = [
  { value: "asap", label: "ASAP" },
  { value: "this_week", label: "This Week" },
  { value: "this_month", label: "This Month" },
  { value: "flexible", label: "Flexible" },
];

export default function ServiceRequestPage() {
  const [form, setForm] = useState({
    requestedService: "",
    type: "",
    platform: "",
    country: "",
    urgency: "flexible",
    budget: "",
    notes: "",
    name: "",
    email: "",
  });

  const mutation = useMutation({
    mutationFn: () =>
      apiRequest(EP.SERVICE_REQUESTS, "POST", {
        ...form,
        budget: form.budget ? Number(form.budget) : undefined,
      }),
    onSuccess: () => {
      emitToast("Service request submitted! We'll get back to you soon.", "success");
      setForm({ requestedService: "", type: "", platform: "", country: "", urgency: "flexible", budget: "", notes: "", name: "", email: "" });
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.requestedService.trim()) {
      emitToast("Please describe the service you need", "error");
      return;
    }
    mutation.mutate();
  };

  const set = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="page-content-narrow">
      <div className="page-header" style={{ textAlign: "center" }}>
        <h1 className="page-title">Request a Service</h1>
        <p className="page-subtitle">
          Can&apos;t find what you need? Tell us and we&apos;ll source it for you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="u-card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div className="auth-field">
          <label className="u-label">What service do you need? *</label>
          <textarea
            className="u-input"
            rows={3}
            placeholder="Describe the service you're looking for..."
            value={form.requestedService}
            onChange={(e) => set("requestedService", e.target.value)}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
          <div className="auth-field">
            <label className="u-label">Your Name</label>
            <input className="u-input" placeholder="Name" value={form.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="auth-field">
            <label className="u-label">Your Email</label>
            <input className="u-input" type="email" placeholder="email@example.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
          <div className="auth-field">
            <label className="u-label">Platform</label>
            <input className="u-input" placeholder="e.g., PayPal, Binance" value={form.platform} onChange={(e) => set("platform", e.target.value)} />
          </div>
          <div className="auth-field">
            <label className="u-label">Country</label>
            <input className="u-input" placeholder="e.g., US, UK, Nigeria" value={form.country} onChange={(e) => set("country", e.target.value)} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
          <div className="auth-field">
            <label className="u-label">Urgency</label>
            <select className="u-input" value={form.urgency} onChange={(e) => set("urgency", e.target.value)}>
              {URGENCY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="auth-field">
            <label className="u-label">Budget ($)</label>
            <input className="u-input" type="number" min="0" placeholder="Optional" value={form.budget} onChange={(e) => set("budget", e.target.value)} />
          </div>
        </div>

        <div className="auth-field">
          <label className="u-label">Additional Notes</label>
          <textarea className="u-input" rows={3} placeholder="Any extra details..." value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </div>

        <button
          type="submit"
          className="u-btn u-btn-primary u-btn-lg"
          disabled={mutation.isPending}
          style={{ width: "100%" }}
        >
          {mutation.isPending ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
}
