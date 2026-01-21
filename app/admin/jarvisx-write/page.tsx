"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";

type ActionItem = {
  type: string;
  payload: Record<string, any>;
  note?: string;
};

type ProposalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "executed"
  | "failed";

type Proposal = {
  _id: string;
  createdAt: string;
  createdByAdminId: string;
  rawAdminCommand: string;
  status: ProposalStatus;
  actions: ActionItem[];
  previewText?: string;
  rejectionReason?: string;
  executedAt?: string | null;
  executionResult?: {
    successCount: number;
    failCount: number;
    errors: Array<{ index: number; type: string; message: string }>;
  };
};

type HealthReport = {
  llm?: { configured: boolean; provider: string; model: string };
};

function statusPill(status: ProposalStatus) {
  const map: Record<ProposalStatus, string> = {
    pending: "bg-yellow-500/15 text-yellow-200 border-yellow-400/20",
    approved: "bg-blue-500/15 text-blue-200 border-blue-400/20",
    executed: "bg-green-500/15 text-green-200 border-green-400/20",
    failed: "bg-red-500/15 text-red-200 border-red-400/20",
    rejected: "bg-slate-500/15 text-slate-200 border-white/10",
  };
  return map[status] || map.pending;
}

function prettyJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

const JARVISX_GROQ_MIGRATION_CUTOFF_ISO = "2025-01-01T00:00:00.000Z";

function isLegacyPreGroqProposal(p: Proposal): boolean {
  const cutoff = Date.parse(JARVISX_GROQ_MIGRATION_CUTOFF_ISO);
  const created = Date.parse(String((p as any)?.createdAt || ""));
  if (!Number.isFinite(cutoff) || !Number.isFinite(created)) return false;
  return created < cutoff;
}

function shouldHideLegacyArtifactsFromHistory(p: Proposal): boolean {
  const haystack = `${String(p.rawAdminCommand || "")}\n${String(
    p.previewText || "",
  )}`.toLowerCase();

  return (
    haystack.includes("openrouter") ||
    haystack.includes("jarvisx_api_key") ||
    haystack.includes("missing jarvisx_api_key") ||
    haystack.includes("jarvisx api key")
  );
}

function toErrorMessage(error: unknown): string {
  if (!error) return "Unknown error";
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

export default function AdminJarvisXWritePage() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();

  const isAdmin = String((user as any)?.role || "") === "admin";
  const email = String((user as any)?.email || "").trim();

  const [command, setCommand] = useState("");
  const [loadingPropose, setLoadingPropose] = useState(false);

  const [activeProposal, setActiveProposal] = useState<Proposal | null>(null);
  const [history, setHistory] = useState<Proposal[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [executingProposal, setExecutingProposal] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsProposal, setDetailsProposal] = useState<Proposal | null>(null);

  const [health, setHealth] = useState<HealthReport | null>(null);

  const loadHealth = async () => {
    try {
      const data = await apiRequest<HealthReport>(
        "/api/jarvisx/health-report",
        "GET",
        null,
        true,
      );
      setHealth(data);
    } catch {
      setHealth(null);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const list = await apiRequest<Proposal[]>(
        "/api/jarvisx/write/proposals?limit=10",
        "GET",
        null,
        true,
      );
      const cleaned = (Array.isArray(list) ? list : []).filter(
        (p) => !shouldHideLegacyArtifactsFromHistory(p),
      );
      setHistory(cleaned);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    loadHistory();
    loadHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin]);

  useEffect(() => {
    setExecutionError(null);
  }, [activeProposal?._id]);

  const proposalActionsEmpty =
    !activeProposal ||
    !Array.isArray(activeProposal.actions) ||
    activeProposal.actions.length === 0;

  const generateProposal = async () => {
    const text = command.trim();
    if (!text) {
      toast("Please enter a command.", "error");
      return;
    }

    setLoadingPropose(true);
    try {
      const res = await apiRequest<{
        proposalId: string;
        actions: ActionItem[];
        previewText: string;
        fallback?: boolean;
      }>("/api/jarvisx/write/propose", "POST", { command: text }, true);

      // PATCH_13: Handle fallback gracefully (AI not configured)
      if (res.fallback) {
        toast("AI not configured. GROQ_API_KEY required.", "error");
      }

      const proposal: Proposal = {
        _id: res.proposalId,
        createdAt: new Date().toISOString(),
        createdByAdminId: "",
        rawAdminCommand: text,
        status: "pending",
        actions: Array.isArray(res.actions) ? res.actions : [],
        previewText: res.previewText,
      };

      setActiveProposal(proposal);
      if (!res.fallback) {
        toast("Proposal generated.", "success");
      }
      loadHistory();
    } catch (err) {
      const message = toErrorMessage(err) || "Failed to generate proposal.";
      console.error("[JARVISX_WRITE_PROPOSE_UI_ERROR]", err);
      toast(message, "error");
    } finally {
      setLoadingPropose(false);
    }
  };

  const approveAndExecute = async () => {
    if (!activeProposal?._id) return;

    setExecutionError(null);
    setExecutingProposal(true);
    try {
      const updated = await apiRequest<any>(
        `/api/jarvisx/write/proposals/${activeProposal._id}/approve`,
        "POST",
        {},
        true,
      );

      if (updated?.ok === false && updated?.action === "EDIT_REQUIRED") {
        const missing = Array.isArray(updated?.missingFields)
          ? updated.missingFields.join(", ")
          : "";
        setExecutionError(
          missing
            ? `Edit required. Missing fields: ${missing}`
            : "Edit required. Missing required fields.",
        );
        toast("Edit required before execution.", "error");
        return;
      }

      setActiveProposal(updated as Proposal);

      if (updated.status === "executed") {
        toast("Executed successfully.", "success");
        // PATCH_16: Dispatch refresh event so buy-service updates instantly
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("services:refresh"));
        }
      } else if (updated.status === "failed")
        toast("Executed with errors.", "error");
      else toast("Updated.", "success");

      loadHistory();
    } catch (err) {
      setExecutionError(toErrorMessage(err) || "Failed to execute proposal.");
    } finally {
      setExecutingProposal(false);
    }
  };

  const rejectProposal = async () => {
    if (!activeProposal?._id) return;

    try {
      const updated = await apiRequest<Proposal>(
        `/api/jarvisx/write/proposals/${activeProposal._id}/reject`,
        "POST",
        { reason: "Rejected by admin" },
        true,
      );
      setActiveProposal(updated);
      toast("Proposal rejected.", "success");
      loadHistory();
    } catch {
      toast("Failed to reject proposal.", "error");
    }
  };

  const openDetails = async (id: string) => {
    setDetailsOpen(true);
    setDetailsProposal(null);
    try {
      const doc = await apiRequest<Proposal>(
        `/api/jarvisx/write/proposals/${id}`,
        "GET",
        null,
        true,
      );
      setDetailsProposal(doc);
    } catch {
      setDetailsProposal(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold">JarvisX Write</h1>
        <p className="text-[#9CA3AF] mt-2">Please log in as admin.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold">JarvisX Write</h1>
        <p className="text-[#9CA3AF] mt-2">Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">JarvisX Write (Proposal-Based)</h1>
        <p className="text-[#9CA3AF]">Admin: {email || "—"}</p>
      </div>

      {health?.llm && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            health.llm.configured
              ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
              : "border-red-400/30 bg-red-500/10 text-red-100"
          }`}
        >
          <p className="font-semibold">
            {health.llm.configured
              ? "🟢 Groq Connected: llama-3.3-70b"
              : "⚠️ Groq API key required (GROQ_API_KEY)"}
          </p>
          <p className="text-xs opacity-80 mt-1">
            Provider: {health.llm.provider || "groq"}
          </p>
        </div>
      )}

      <Card title="Command">
        <div className="space-y-3">
          <textarea
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Tell Jarvis what to do… (e.g., Add new service Handshake AI screening for $20, manual delivery, category KYC, active true)"
            className="w-full min-h-[120px] rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-blue-500/30"
            disabled={loadingPropose}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={generateProposal}
              disabled={loadingPropose}
              className="rounded-2xl px-4 py-3 text-sm font-semibold border border-white/10 bg-white/10 hover:bg-white/15 text-white transition disabled:opacity-50"
            >
              {loadingPropose ? "Generating…" : "Generate Proposal"}
            </button>
            <p className="text-xs text-slate-500">
              Safety: JarvisX will only propose actions. Nothing executes until
              you approve.
            </p>
          </div>
        </div>
      </Card>

      <Card title="Proposal Preview">
        {!activeProposal ? (
          <p className="text-sm text-[#9CA3AF]">No proposal yet.</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full border text-xs ${statusPill(
                  activeProposal.status,
                )}`}
              >
                {activeProposal.status.toUpperCase()}
              </span>
              <span className="text-xs text-slate-500">
                Proposal ID: {activeProposal._id}
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <p className="text-xs text-slate-500">Preview</p>
              <p className="text-sm text-slate-200 whitespace-pre-wrap">
                {String(activeProposal.previewText || "").trim() ||
                  "(no preview text)"}
              </p>
            </div>

            {proposalActionsEmpty ? (
              <p className="text-sm text-yellow-200">
                Jarvis needs clarification (no actions were generated).
              </p>
            ) : (
              <div className="space-y-3">
                {activeProposal.actions.map((a, idx) => (
                  <div
                    key={`${activeProposal._id}-${idx}`}
                    className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden"
                  >
                    <div className="px-4 py-3 flex items-center justify-between">
                      <p className="text-sm text-white font-semibold">
                        {idx + 1}. {a.type}
                      </p>
                      {a.note ? (
                        <span className="text-xs text-slate-400">{a.note}</span>
                      ) : null}
                    </div>
                    <pre className="px-4 pb-4 text-xs text-slate-300 overflow-x-auto">
                      {prettyJson(a.payload)}
                    </pre>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={approveAndExecute}
                disabled={
                  activeProposal.status !== "pending" ||
                  proposalActionsEmpty ||
                  executingProposal
                }
                className="rounded-2xl px-4 py-3 text-sm font-semibold border border-green-400/20 bg-green-500/15 hover:bg-green-500/20 text-green-100 transition disabled:opacity-50"
              >
                {executingProposal ? "Executing…" : "Approve & Execute"}
              </button>
              <button
                type="button"
                onClick={rejectProposal}
                disabled={activeProposal.status !== "pending"}
                className="rounded-2xl px-4 py-3 text-sm font-semibold border border-red-400/20 bg-red-500/15 hover:bg-red-500/20 text-red-100 transition disabled:opacity-50"
              >
                Reject
              </button>

              {activeProposal.executionResult ? (
                <div className="ml-auto text-xs text-slate-400">
                  Success: {activeProposal.executionResult.successCount} · Fail:{" "}
                  {activeProposal.executionResult.failCount}
                </div>
              ) : null}
            </div>

            {executionError ? (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3">
                <p className="text-sm text-red-100 font-semibold">
                  Execution failed
                </p>
                <p className="mt-1 text-xs text-red-100/90 whitespace-pre-wrap">
                  {executionError}
                </p>
              </div>
            ) : null}

            {activeProposal.executionResult?.errors?.length ? (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3">
                <p className="text-sm text-red-100 font-semibold">Errors</p>
                <ul className="mt-2 space-y-1 text-xs text-red-100/90">
                  {activeProposal.executionResult.errors
                    .slice(0, 10)
                    .map((e) => (
                      <li key={`${e.index}-${e.type}`}>
                        #{e.index + 1} {e.type}: {e.message}
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
      </Card>

      <Card title="Proposal History">
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#9CA3AF]">Last 10 proposals.</p>
          <button
            type="button"
            onClick={loadHistory}
            disabled={loadingHistory}
            className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 px-3 py-2 text-sm transition disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {history.length === 0 ? (
            <p className="text-sm text-[#9CA3AF]">No proposals yet.</p>
          ) : (
            history.map((p) => (
              <button
                key={p._id}
                type="button"
                onClick={() => openDetails(p._id)}
                className="w-full text-left rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 transition"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full border text-xs ${statusPill(
                        p.status,
                      )}`}
                    >
                      {p.status.toUpperCase()}
                    </span>
                    {isLegacyPreGroqProposal(p) ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-slate-200">
                        Legacy (pre-Groq)
                      </span>
                    ) : null}
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(p.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-200 line-clamp-2">
                  {p.previewText || p.rawAdminCommand}
                </p>
              </button>
            ))
          )}
        </div>
      </Card>

      {detailsOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-[#020617]/95 shadow-[0_18px_60px_rgba(0,0,0,0.55)] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <p className="text-white font-semibold">Proposal Details</p>
              <button
                type="button"
                onClick={() => {
                  setDetailsOpen(false);
                  setDetailsProposal(null);
                }}
                className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 px-3 py-2 text-sm transition"
              >
                Close
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {!detailsProposal ? (
                <p className="text-sm text-[#9CA3AF]">Loading…</p>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full border text-xs ${statusPill(
                        detailsProposal.status,
                      )}`}
                    >
                      {detailsProposal.status.toUpperCase()}
                    </span>
                    <span className="text-xs text-slate-500">
                      {detailsProposal._id}
                    </span>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-xs text-slate-500">Command</p>
                    <p className="text-sm text-slate-200 whitespace-pre-wrap">
                      {detailsProposal.rawAdminCommand}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-xs text-slate-500">Preview</p>
                    <p className="text-sm text-slate-200 whitespace-pre-wrap">
                      {detailsProposal.previewText || "(none)"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <p className="text-xs text-slate-500">Actions</p>
                    <pre className="text-xs text-slate-300 overflow-x-auto">
                      {prettyJson(detailsProposal.actions)}
                    </pre>
                  </div>

                  {detailsProposal.executionResult ? (
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                      <p className="text-xs text-slate-500">Execution Result</p>
                      <pre className="text-xs text-slate-300 overflow-x-auto">
                        {prettyJson(detailsProposal.executionResult)}
                      </pre>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
