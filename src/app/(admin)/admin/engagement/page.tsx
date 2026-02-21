"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { MetricsRibbon, Badge, ConfirmModal } from "@/design-system";
import { emitToast } from "@/hooks/useToast";

type Tab = "campaigns" | "nudges" | "status";

export default function EngagementEngine() {
  const [tab, setTab] = useState<Tab>("campaigns");
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<{
    title: string;
    msg: string;
    fn: () => Promise<unknown>;
  } | null>(null);

  /* ─── Campaign form ─── */
  const [campaignForm, setCampaignForm] = useState({
    subject: "",
    body: "",
    audience: "all",
  });

  /* ─── QUERIES ─── */
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ["admin-campaign-events"],
    queryFn: () =>
      apiRequest<{ events: Record<string, unknown>[] }>(
        EP.ADMIN_CAMPAIGNS_EVENTS,
        "GET",
        undefined,
        true,
      ),
    enabled: tab === "campaigns",
  });

  const { data: engagementStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["engagement-status"],
    queryFn: () =>
      apiRequest<Record<string, unknown>>(
        EP.ENGAGEMENT_STATUS,
        "GET",
        undefined,
        true,
      ),
    enabled: tab === "status",
  });

  /* ─── MUTATIONS ─── */
  const sendCampaign = useMutation({
    mutationFn: () =>
      apiRequest(EP.ADMIN_CAMPAIGNS_SEND, "POST", campaignForm, true),
    onSuccess: () => {
      emitToast("Campaign sent!", "success");
      setCampaignForm({ subject: "", body: "", audience: "all" });
      queryClient.invalidateQueries({ queryKey: ["admin-campaign-events"] });
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  const nudgeMut = useMutation({
    mutationFn: async ({ url }: { url: string }) =>
      apiRequest(url, "POST", undefined, true),
    onSuccess: () => {
      emitToast("Nudge sent!", "success");
      setConfirmAction(null);
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  const cycleMut = useMutation({
    mutationFn: () =>
      apiRequest(EP.ENGAGEMENT_RUN_CYCLE, "POST", undefined, true),
    onSuccess: () => {
      emitToast("Engagement cycle triggered", "success");
      queryClient.invalidateQueries({ queryKey: ["engagement-status"] });
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  const metrics = [
    { label: "Campaigns Sent", value: eventsData?.events?.length ?? "—" },
    {
      label: "Engine Status",
      value: engagementStatus ? "Active" : "—",
      color: "var(--color-success)",
    },
  ];

  return (
    <div style={{ padding: "var(--space-5)" }}>
      <h1 className="u-heading-1" style={{ marginBottom: "var(--space-4)" }}>
        Engagement Engine
      </h1>

      <MetricsRibbon
        metrics={metrics}
        loading={eventsLoading || statusLoading}
      />

      <div className="tab-bar" style={{ marginTop: "var(--space-4)" }}>
        {(["campaigns", "nudges", "status"] as Tab[]).map((t) => (
          <button
            key={t}
            className={`tab-bar-item ${tab === t ? "tab-bar-item--active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ marginTop: "var(--space-4)" }}>
        {/* Campaigns Tab */}
        {tab === "campaigns" && (
          <div style={{ display: "flex", gap: "var(--space-5)" }}>
            {/* Send Form */}
            <div className="u-card" style={{ flex: 1, maxWidth: 500 }}>
              <h3
                className="u-heading-3"
                style={{ marginBottom: "var(--space-3)" }}
              >
                Send Campaign
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--space-3)",
                }}
              >
                <div className="auth-field">
                  <label className="u-label">Subject</label>
                  <input
                    className="u-input"
                    placeholder="Campaign subject"
                    value={campaignForm.subject}
                    onChange={(e) =>
                      setCampaignForm((f) => ({
                        ...f,
                        subject: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="auth-field">
                  <label className="u-label">Audience</label>
                  <select
                    className="u-input"
                    value={campaignForm.audience}
                    onChange={(e) =>
                      setCampaignForm((f) => ({
                        ...f,
                        audience: e.target.value,
                      }))
                    }
                  >
                    <option value="all">All Users</option>
                    <option value="workers">Workers Only</option>
                    <option value="clients">Clients Only</option>
                  </select>
                </div>
                <div className="auth-field">
                  <label className="u-label">Body</label>
                  <textarea
                    className="u-input"
                    rows={5}
                    placeholder="Email body..."
                    value={campaignForm.body}
                    onChange={(e) =>
                      setCampaignForm((f) => ({ ...f, body: e.target.value }))
                    }
                  />
                </div>
                <button
                  className="u-btn u-btn-primary"
                  disabled={
                    !campaignForm.subject ||
                    !campaignForm.body ||
                    sendCampaign.isPending
                  }
                  onClick={() => sendCampaign.mutate()}
                >
                  {sendCampaign.isPending ? "Sending..." : "Send Campaign"}
                </button>
              </div>
            </div>

            {/* Event Log */}
            <div style={{ flex: 1 }}>
              <h3
                className="u-heading-3"
                style={{ marginBottom: "var(--space-3)" }}
              >
                Campaign Log
              </h3>
              {eventsData?.events && eventsData.events.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-2)",
                  }}
                >
                  {eventsData.events.map((ev, i) => (
                    <div
                      key={i}
                      className="u-panel"
                      style={{ padding: "var(--space-3)" }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: "var(--weight-medium)",
                            fontSize: "var(--text-sm)",
                          }}
                        >
                          {String(ev.subject || ev.event || "Campaign")}
                        </span>
                        <Badge status={String(ev.status || "sent")} size="sm" />
                      </div>
                      <div
                        style={{
                          fontSize: "var(--text-xs)",
                          color: "var(--color-text-tertiary)",
                          marginTop: 4,
                        }}
                      >
                        {ev.createdAt
                          ? new Date(String(ev.createdAt)).toLocaleString()
                          : "—"}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    color: "var(--color-text-tertiary)",
                    fontSize: "var(--text-sm)",
                  }}
                >
                  No campaigns sent yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Nudges Tab */}
        {tab === "nudges" && (
          <div className="u-grid u-grid-2" style={{ maxWidth: 600 }}>
            {[
              {
                label: "Signup Nudge",
                desc: "Nudge new signups to complete profiles",
                url: EP.ENGAGEMENT_SIGNUP_NUDGE,
              },
              {
                label: "Screening Nudge",
                desc: "Remind workers about pending screenings",
                url: EP.ENGAGEMENT_SCREENING_NUDGE,
              },
              {
                label: "Notify Ready Workers",
                desc: "Notify workers who are ready for projects",
                url: EP.ENGAGEMENT_NOTIFY_READY,
              },
              {
                label: "Notify Interested",
                desc: "Email users who showed interest",
                url: EP.ENGAGEMENT_NOTIFY_INTERESTED,
              },
            ].map((nudge) => (
              <div
                key={nudge.label}
                className="u-card"
                style={{ padding: "var(--space-4)" }}
              >
                <h4
                  style={{
                    fontWeight: "var(--weight-medium)",
                    marginBottom: "var(--space-2)",
                  }}
                >
                  {nudge.label}
                </h4>
                <p
                  style={{
                    fontSize: "var(--text-sm)",
                    color: "var(--color-text-secondary)",
                    marginBottom: "var(--space-3)",
                  }}
                >
                  {nudge.desc}
                </p>
                <button
                  className="u-btn u-btn-primary u-btn-sm"
                  onClick={() =>
                    setConfirmAction({
                      title: nudge.label,
                      msg: `Trigger "${nudge.label}"?`,
                      fn: () => nudgeMut.mutateAsync({ url: nudge.url }),
                    })
                  }
                >
                  Trigger
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Status Tab */}
        {tab === "status" && (
          <div style={{ maxWidth: 500 }}>
            <div className="u-card" style={{ marginBottom: "var(--space-4)" }}>
              <h3
                className="u-heading-3"
                style={{ marginBottom: "var(--space-3)" }}
              >
                Engagement Status
              </h3>
              {statusLoading ? (
                <div className="u-spinner" />
              ) : engagementStatus ? (
                <pre
                  style={{
                    fontSize: "var(--text-xs)",
                    color: "var(--color-text-secondary)",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {JSON.stringify(engagementStatus, null, 2)}
                </pre>
              ) : (
                <p style={{ color: "var(--color-text-tertiary)" }}>
                  No status data.
                </p>
              )}
            </div>
            <button
              className="u-btn u-btn-primary"
              disabled={cycleMut.isPending}
              onClick={() => cycleMut.mutate()}
            >
              {cycleMut.isPending ? "Running..." : "Run Engagement Cycle"}
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!confirmAction}
        title={confirmAction?.title ?? ""}
        message={confirmAction?.msg ?? ""}
        onConfirm={() => confirmAction?.fn() ?? Promise.resolve()}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}
