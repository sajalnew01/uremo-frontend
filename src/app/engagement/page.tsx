"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRequireAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/api";
import { EP } from "@/lib/api/endpoints";
import { useAuthStore } from "@/store";

type EngagementStatusResponse = {
  ok?: boolean;
  success?: boolean;
  data?: Record<string, unknown>;
  status?: Record<string, unknown>;
};

export default function EngagementPage() {
  const ok = useRequireAuth();
  if (!ok) return null;

  const { isAdmin } = useAuthStore();
  const qc = useQueryClient();
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const statusQuery = useQuery({
    queryKey: ["engagement", "status"],
    queryFn: async () => {
      const res = await apiRequest<EngagementStatusResponse>(
        EP.ENGAGEMENT_STATUS,
        "GET",
        undefined,
        true,
      );
      return res.data ?? res.status ?? res;
    },
  });

  const runCycleMutation = useMutation({
    mutationFn: async () =>
      apiRequest<{ ok: boolean; message?: string }>(
        EP.ENGAGEMENT_RUN_CYCLE,
        "POST",
        undefined,
        true,
      ),
    onSuccess: (res) => {
      setActionMsg(res.message || "Engagement cycle completed");
      qc.invalidateQueries({ queryKey: ["engagement"] });
    },
    onError: (e) => setActionMsg(e instanceof Error ? e.message : "Failed"),
  });

  const signupNudgeMutation = useMutation({
    mutationFn: async () =>
      apiRequest<{ ok: boolean; message?: string }>(
        EP.ENGAGEMENT_SIGNUP_NUDGE,
        "POST",
        undefined,
        true,
      ),
    onSuccess: (res) => {
      setActionMsg(res.message || "Signup nudges sent");
    },
    onError: (e) => setActionMsg(e instanceof Error ? e.message : "Failed"),
  });

  const screeningNudgeMutation = useMutation({
    mutationFn: async () =>
      apiRequest<{ ok: boolean; message?: string }>(
        EP.ENGAGEMENT_SCREENING_NUDGE,
        "POST",
        undefined,
        true,
      ),
    onSuccess: (res) => {
      setActionMsg(res.message || "Screening nudges sent");
    },
    onError: (e) => setActionMsg(e instanceof Error ? e.message : "Failed"),
  });

  const notifyReadyMutation = useMutation({
    mutationFn: async () =>
      apiRequest<{ ok: boolean; message?: string }>(
        EP.ENGAGEMENT_NOTIFY_READY,
        "POST",
        undefined,
        true,
      ),
    onSuccess: (res) => {
      setActionMsg(res.message || "Ready worker notifications sent");
    },
    onError: (e) => setActionMsg(e instanceof Error ? e.message : "Failed"),
  });

  const notifyInterestedMutation = useMutation({
    mutationFn: async () =>
      apiRequest<{ ok: boolean; message?: string }>(
        EP.ENGAGEMENT_NOTIFY_INTERESTED,
        "POST",
        undefined,
        true,
      ),
    onSuccess: (res) => {
      setActionMsg(res.message || "Interested user notifications sent");
    },
    onError: (e) => setActionMsg(e instanceof Error ? e.message : "Failed"),
  });

  const status = statusQuery.data;
  const statusEntries =
    status && typeof status === "object"
      ? Object.entries(status).filter(([k]) => k !== "ok" && k !== "success")
      : [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <div className="text-sm font-semibold">Engagement</div>
        <div className="mt-1 text-sm text-[var(--muted)]">
          User engagement controls and automated nudge system.
        </div>
      </div>

      {/* Status */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          Engagement Status
        </div>
        {statusQuery.isLoading ? (
          <div className="mt-3 text-sm text-[var(--muted)]">Loading...</div>
        ) : statusQuery.isError ? (
          <div className="mt-3 text-sm text-[var(--muted)]">
            Failed to load status.
          </div>
        ) : statusEntries.length > 0 ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {statusEntries.map(([key, value]) => (
              <div
                key={key}
                className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3"
              >
                <div className="text-xs text-[var(--muted)]">{key}</div>
                <div className="mt-1 text-sm font-semibold truncate">
                  {typeof value === "object"
                    ? JSON.stringify(value)
                    : String(value)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 text-sm text-[var(--muted)]">
            No status data available.
          </div>
        )}
      </div>

      {/* Action message */}
      {actionMsg && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-4 py-2 text-sm text-[var(--muted)]">
          {actionMsg}
        </div>
      )}

      {/* Admin-only engagement actions */}
      {isAdmin && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            Admin Actions
          </div>
          <div className="mt-1 text-xs text-[var(--muted)]">
            Trigger engagement cycles and targeted nudges.
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <button
              type="button"
              disabled={runCycleMutation.isPending}
              onClick={() => {
                setActionMsg(null);
                runCycleMutation.mutate();
              }}
              className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-4 py-3 text-left disabled:opacity-50"
            >
              <div className="text-sm font-semibold">Run Full Cycle</div>
              <div className="mt-1 text-xs text-[var(--muted)]">
                Execute complete engagement cycle
              </div>
            </button>

            <button
              type="button"
              disabled={signupNudgeMutation.isPending}
              onClick={() => {
                setActionMsg(null);
                signupNudgeMutation.mutate();
              }}
              className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-4 py-3 text-left disabled:opacity-50"
            >
              <div className="text-sm font-semibold">Signup Nudge</div>
              <div className="mt-1 text-xs text-[var(--muted)]">
                Nudge incomplete signups
              </div>
            </button>

            <button
              type="button"
              disabled={screeningNudgeMutation.isPending}
              onClick={() => {
                setActionMsg(null);
                screeningNudgeMutation.mutate();
              }}
              className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-4 py-3 text-left disabled:opacity-50"
            >
              <div className="text-sm font-semibold">Screening Nudge</div>
              <div className="mt-1 text-xs text-[var(--muted)]">
                Nudge pending screenings
              </div>
            </button>

            <button
              type="button"
              disabled={notifyReadyMutation.isPending}
              onClick={() => {
                setActionMsg(null);
                notifyReadyMutation.mutate();
              }}
              className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-4 py-3 text-left disabled:opacity-50"
            >
              <div className="text-sm font-semibold">Notify Ready Workers</div>
              <div className="mt-1 text-xs text-[var(--muted)]">
                Alert workers ready for tasks
              </div>
            </button>

            <button
              type="button"
              disabled={notifyInterestedMutation.isPending}
              onClick={() => {
                setActionMsg(null);
                notifyInterestedMutation.mutate();
              }}
              className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-4 py-3 text-left disabled:opacity-50"
            >
              <div className="text-sm font-semibold">
                Notify Interested Users
              </div>
              <div className="mt-1 text-xs text-[var(--muted)]">
                Alert users with matching interests
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
