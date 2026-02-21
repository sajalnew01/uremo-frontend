"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { useRequireAuth } from "@/hooks/useAuth";
import { Badge } from "@/design-system";
import { emitToast } from "@/hooks/useToast";
import Link from "next/link";
import type { Ticket, TicketCategory, TicketPriority } from "@/types";

const CATEGORIES: TicketCategory[] = ["general", "payment", "order", "kyc", "rental", "technical", "affiliate", "other"];
const PRIORITIES: TicketPriority[] = ["low", "medium", "high", "urgent"];

export default function SupportPage() {
  const ready = useRequireAuth();
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<TicketCategory>("general");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [message, setMessage] = useState("");

  const { data, isLoading } = useQuery<{ tickets: Ticket[] }>({
    queryKey: ["tickets"],
    queryFn: () => apiRequest(EP.TICKETS, "GET", undefined, true),
    enabled: ready,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      apiRequest(EP.TICKETS, "POST", { subject, category, priority, message }, true),
    onSuccess: () => {
      emitToast("Ticket created!", "success");
      setShowNew(false);
      setSubject(""); setMessage("");
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  if (!ready) return null;

  const tickets = data?.tickets || [];

  return (
    <div className="page-content">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
        <div>
          <h1 className="page-title">Support</h1>
          <p className="page-subtitle">{tickets.length} ticket{tickets.length !== 1 ? "s" : ""}</p>
        </div>
        <button className="u-btn u-btn-primary" onClick={() => setShowNew(!showNew)}>
          {showNew ? "Cancel" : "New Ticket"}
        </button>
      </div>

      {/* New Ticket Form */}
      {showNew && (
        <form
          className="u-card"
          style={{ marginBottom: "var(--space-6)" }}
          onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }}
        >
          <h3 className="u-heading-3" style={{ marginBottom: "var(--space-4)" }}>Create Ticket</h3>
          <div className="auth-field">
            <label className="u-label">Subject *</label>
            <input className="u-input" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Brief summary of your issue" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
            <div>
              <label className="u-label">Category</label>
              <select className="u-input" value={category} onChange={(e) => setCategory(e.target.value as TicketCategory)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="u-label">Priority</label>
              <select className="u-input" value={priority} onChange={(e) => setPriority(e.target.value as TicketPriority)}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div className="auth-field">
            <label className="u-label">Message *</label>
            <textarea className="u-input" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe your issue in detail..." />
          </div>
          <button type="submit" className="u-btn u-btn-primary" disabled={!subject || !message || createMutation.isPending}>
            {createMutation.isPending ? "Submitting..." : "Submit Ticket"}
          </button>
        </form>
      )}

      {/* Ticket List */}
      {isLoading ? (
        <div className="page-loading"><div className="u-spinner" /> Loading...</div>
      ) : tickets.length === 0 ? (
        <div className="page-empty">No tickets yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {tickets.map((ticket) => (
            <Link
              key={ticket._id}
              href={`/support/${ticket._id}`}
              className="u-card"
              style={{ display: "flex", justifyContent: "space-between", alignItems: "center", textDecoration: "none", color: "inherit" }}
            >
              <div>
                <div style={{ fontWeight: "var(--weight-semibold)", fontSize: "var(--text-sm)", marginBottom: "var(--space-1)" }}>
                  {ticket.subject}
                </div>
                <div style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
                  {ticket.category} · {new Date(ticket.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                <Badge status={ticket.status} />
                <Badge status={ticket.priority} size="sm" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
