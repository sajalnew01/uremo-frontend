"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/Card";
import { apiRequest } from "@/lib/api";
import { jarvisxApi } from "@/lib/api/jarvisx";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

type JarvisSuggestedAction = { label: string; url: string };

type JarvisReply = {
  reply: string;
  confidence: number;
  usedSources: string[];
  suggestedActions: JarvisSuggestedAction[];
};

type AdminContext = {
  settings?: any;
  services?: any[];
  paymentMethods?: any[];
  workPositions?: any[];
  rules?: any;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  meta?: { sources?: string[]; actions?: JarvisSuggestedAction[] };
};

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
  intent?: string;
  reasoning?: string;
  requiresApproval?: boolean;
  undoActions?: ActionItem[];
  rejectionReason?: string;
  executedAt?: string | null;
  executionResult?: {
    successCount: number;
    failCount: number;
    errors: Array<{ index: number; type: string; message: string }>;
  };
};

type MemoryItem = {
  _id: string;
  source: "admin_correction" | "approval" | "rejection" | "system_outcome";
  triggerText: string;
  correctResponse: string;
  tags?: string[];
  confidence: number;
  createdAt: string;
};

type HealthReport = {
  generatedAt?: string;
  llm?: { configured?: boolean; provider?: string; model?: string };
  services?: { total?: number; active?: number; missingHeroCount?: number };
  workPositions?: { total?: number; active?: number };
  serviceRequests?: { total?: number; new?: number; draft?: number };
  orders?: { paymentProofPendingCount?: number };
  settings?: { missingKeys?: string[] };
  jarvisx?: {
    chatTotal24h?: number;
    chatOk24h?: number;
    chatErrorRate24h?: number;
  };
};

function uuid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

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
    p.previewText || ""
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

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl px-4 py-2 text-sm font-semibold border transition ${
        active
          ? "border-blue-400/30 bg-blue-500/15 text-blue-100"
          : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-200"
      }`}
    >
      {label}
    </button>
  );
}

export default function AdminJarvisXCommandCenter() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const isAdmin = String((user as any)?.role || "") === "admin";
  const email = String((user as any)?.email || "").trim();

  const [tab, setTab] = useState<"chat" | "proposals" | "memory">("chat");

  // Health + context
  const [context, setContext] = useState<AdminContext | null>(null);
  const [loadingContext, setLoadingContext] = useState(true);
  const [health, setHealth] = useState<HealthReport | null>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: uuid(),
      role: "assistant",
      text: "Yes boss ✅ I’m listening. What should I check?",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  // Proposals
  const [command, setCommand] = useState("");
  const [loadingPropose, setLoadingPropose] = useState(false);
  const [activeProposal, setActiveProposal] = useState<Proposal | null>(null);
  const [history, setHistory] = useState<Proposal[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [actionsDraft, setActionsDraft] = useState<string>("");
  const [savingEdits, setSavingEdits] = useState(false);

  const [executingProposal, setExecutingProposal] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsProposal, setDetailsProposal] = useState<Proposal | null>(null);

  // Memory
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loadingMemories, setLoadingMemories] = useState(false);

  const summary = useMemo(() => {
    const sCount = Array.isArray(context?.services)
      ? context!.services!.length
      : 0;
    const pCount = Array.isArray(context?.paymentMethods)
      ? context!.paymentMethods!.length
      : 0;
    const wCount = Array.isArray(context?.workPositions)
      ? context!.workPositions!.length
      : 0;
    return { sCount, pCount, wCount };
  }, [context]);

  const loadContext = async () => {
    setLoadingContext(true);
    try {
      const ctx = await apiRequest<AdminContext>(
        "/api/jarvisx/context/admin",
        "GET",
        null,
        true
      );
      setContext(ctx);
    } catch {
      setContext(null);
    } finally {
      setLoadingContext(false);
    }
  };

  const loadHealth = async () => {
    setLoadingHealth(true);
    try {
      const data = await apiRequest<HealthReport>(
        "/api/jarvisx/health-report",
        "GET",
        null,
        true
      );
      // Ensure safe defaults for all nested objects to prevent crashes
      const safeHealth: HealthReport = {
        generatedAt: data?.generatedAt ?? new Date().toISOString(),
        llm: data?.llm ?? { configured: false, provider: "", model: "" },
        services: {
          total: data?.services?.total ?? 0,
          active: data?.services?.active ?? 0,
          missingHeroCount: data?.services?.missingHeroCount ?? 0,
        },
        workPositions: {
          total: data?.workPositions?.total ?? 0,
          active: data?.workPositions?.active ?? 0,
        },
        serviceRequests: {
          total: data?.serviceRequests?.total ?? 0,
          new: data?.serviceRequests?.new ?? 0,
          draft: data?.serviceRequests?.draft ?? 0,
        },
        orders: {
          paymentProofPendingCount: data?.orders?.paymentProofPendingCount ?? 0,
        },
        settings: {
          missingKeys: data?.settings?.missingKeys ?? [],
        },
        jarvisx: {
          chatTotal24h: data?.jarvisx?.chatTotal24h ?? 0,
          chatOk24h: data?.jarvisx?.chatOk24h ?? 0,
          chatErrorRate24h: data?.jarvisx?.chatErrorRate24h ?? 0,
        },
      };
      setHealth(safeHealth);
    } catch {
      setHealth(null);
    } finally {
      setLoadingHealth(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const list = await apiRequest<Proposal[]>(
        "/api/jarvisx/write/proposals?limit=10",
        "GET",
        null,
        true
      );
      const cleaned = (Array.isArray(list) ? list : []).filter(
        (p) => !shouldHideLegacyArtifactsFromHistory(p)
      );
      setHistory(cleaned);
    } catch {
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadMemory = async () => {
    setLoadingMemories(true);
    try {
      const list = await apiRequest<MemoryItem[]>(
        "/api/jarvisx/write/memory?limit=100",
        "GET",
        null,
        true
      );
      setMemories(Array.isArray(list) ? list : []);
    } catch {
      setMemories([]);
    } finally {
      setLoadingMemories(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) return;
    loadContext();
    loadHealth();
    loadHistory();
    loadMemory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isAdmin]);

  useEffect(() => {
    if (!activeProposal) {
      setActionsDraft("");
      setExecutionError(null);
      return;
    }
    setActionsDraft(prettyJson(activeProposal.actions || []));
    setExecutionError(null);
  }, [activeProposal]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    const userMsg: ChatMessage = { id: uuid(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);

    setSending(true);
    try {
      const res = await jarvisxApi.sendMessage({
        message: text,
        mode: "admin",
        meta: { page: "/admin/jarvisx" },
      });

      if (res?.ok === false) {
        setMessages((prev) => [
          ...prev,
          {
            id: uuid(),
            role: "assistant",
            text: "JarvisX is temporarily unavailable. Please try again shortly.",
          },
        ]);
        return;
      }

      const assistantMsg: ChatMessage = {
        id: uuid(),
        role: "assistant",
        text:
          String(res?.reply || "").trim() ||
          "I understood. Let me process that for you.",
        meta: {
          sources: Array.isArray(res?.usedSources) ? res.usedSources : [],
          actions: Array.isArray(res?.suggestedActions)
            ? res.suggestedActions
            : [],
        },
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: uuid(),
          role: "assistant",
          text: "JarvisX is temporarily unavailable. Please try again shortly.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

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
      }>("/api/jarvisx/write/propose", "POST", { command: text }, true);

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
      toast("Proposal generated.", "success");
      await loadHistory();
    } catch {
      toast("Failed to generate proposal.", "error");
    } finally {
      setLoadingPropose(false);
    }
  };

  const saveEdits = async () => {
    if (!activeProposal?._id) return;
    if (activeProposal.status !== "pending") {
      toast("Only pending proposals can be edited.", "error");
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(actionsDraft || "[]");
    } catch {
      toast("Invalid JSON in Actions editor.", "error");
      return;
    }

    if (!Array.isArray(parsed)) {
      toast("Actions must be a JSON array.", "error");
      return;
    }

    setSavingEdits(true);
    try {
      const updated = await apiRequest<Proposal>(
        `/api/jarvisx/write/proposals/${activeProposal._id}`,
        "PUT",
        { actions: parsed },
        true
      );
      setActiveProposal(updated);
      toast("Edits saved.", "success");
      await loadHistory();
    } catch {
      toast("Failed to save edits.", "error");
    } finally {
      setSavingEdits(false);
    }
  };

  const approveAndExecute = async () => {
    if (!activeProposal?._id) return;

    setExecutionError(null);
    setExecutingProposal(true);
    try {
      const updated = await apiRequest<Proposal>(
        `/api/jarvisx/write/proposals/${activeProposal._id}/approve`,
        "POST",
        {},
        true
      );
      setActiveProposal(updated);

      if (updated.status === "executed")
        toast("Executed successfully.", "success");
      else if (updated.status === "failed")
        toast("Executed with errors.", "error");
      else toast("Updated.", "success");

      await loadHistory();
      await loadMemory();
      await loadHealth();
    } catch (err: any) {
      // P0 FIX: Better error display for validation failures
      const errorData = err?.response?.data || err?.data || err;
      const validationErrors = errorData?.validationErrors;
      const details = errorData?.details;

      if (validationErrors && validationErrors.length > 0) {
        const errorMsg = validationErrors
          .map(
            (e: any) =>
              `Action ${e.index + 1} (${e.type}): Missing ${
                e.missingFields?.join(", ") || "unknown fields"
              }`
          )
          .join("\n");
        setExecutionError(`Validation failed:\n${errorMsg}`);
        toast(
          "Proposal has missing required fields. Please edit before executing.",
          "error"
        );
      } else if (details) {
        setExecutionError(details);
        toast("Validation failed.", "error");
      } else {
        setExecutionError(toErrorMessage(err) || "Failed to execute proposal.");
      }
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
        true
      );
      setActiveProposal(updated);
      toast("Proposal rejected.", "success");
      await loadHistory();
      await loadMemory();
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
        true
      );
      setDetailsProposal(doc);
    } catch {
      setDetailsProposal(null);
    }
  };

  const deleteMemory = async (id: string) => {
    if (!id) return;
    try {
      await apiRequest(`/api/jarvisx/write/memory/${id}`, "DELETE", null, true);
      toast("Memory deleted.", "success");
      await loadMemory();
    } catch {
      toast("Failed to delete memory.", "error");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold">JarvisX</h1>
        <p className="text-[#9CA3AF] mt-2">Please log in as admin.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-2xl font-bold">JarvisX</h1>
        <p className="text-[#9CA3AF] mt-2">Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">JarvisX Command Center</h1>
          <p className="text-[#9CA3AF]">Admin: {email || "—"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <TabButton
            active={tab === "chat"}
            label="Chat"
            onClick={() => setTab("chat")}
          />
          <TabButton
            active={tab === "proposals"}
            label="Proposals"
            onClick={() => setTab("proposals")}
          />
          <TabButton
            active={tab === "memory"}
            label="Memory"
            onClick={() => setTab("memory")}
          />
        </div>
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
              ? `LLM Connected: ${health.llm.model}`
              : "LLM Not Configured"}
          </p>
          <p className="text-xs opacity-80 mt-1">
            Provider: {health.llm.provider || "—"}
          </p>
        </div>
      )}

      {tab === "chat" && (
        <>
          <Card title="Health">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#9CA3AF]">
                Operational snapshot (last 24h).
              </p>
              <button
                type="button"
                onClick={loadHealth}
                disabled={loadingHealth}
                className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 px-3 py-2 text-sm transition disabled:opacity-50"
              >
                {loadingHealth ? "Refreshing…" : "Refresh"}
              </button>
            </div>

            {!health ? (
              <p className="mt-3 text-sm text-[#9CA3AF]">
                No health report yet.
              </p>
            ) : (
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-slate-200">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-500">Services</p>
                  <p>Total: {health?.services?.total ?? 0}</p>
                  <p>Active: {health?.services?.active ?? 0}</p>
                  <p>Missing hero: {health?.services?.missingHeroCount ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-500">Work Positions</p>
                  <p>Total: {health?.workPositions?.total ?? 0}</p>
                  <p>Active: {health?.workPositions?.active ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-500">Service Requests</p>
                  <p>Total: {health?.serviceRequests?.total ?? 0}</p>
                  <p>New: {health?.serviceRequests?.new ?? 0}</p>
                  <p>Draft: {health?.serviceRequests?.draft ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-500">JarvisX</p>
                  <p>Chats 24h: {health?.jarvisx?.chatTotal24h ?? 0}</p>
                  <p>
                    Error rate:{" "}
                    {((health?.jarvisx?.chatErrorRate24h ?? 0) * 100).toFixed(
                      2
                    )}
                    %
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Pending payment proofs:{" "}
                    {health?.orders?.paymentProofPendingCount ?? 0}
                  </p>
                </div>
              </div>
            )}

            {health?.settings?.missingKeys?.length ? (
              <p className="mt-4 text-xs text-amber-200">
                Missing settings: {health.settings.missingKeys.join(", ")}
              </p>
            ) : null}
          </Card>

          <Card title="Context">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[#9CA3AF]">
                Admin context for JarvisX prompts.
              </p>
              <button
                type="button"
                onClick={loadContext}
                disabled={loadingContext}
                className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 px-3 py-2 text-sm transition disabled:opacity-50"
              >
                {loadingContext ? "Refreshing…" : "Refresh"}
              </button>
            </div>

            {loadingContext ? (
              <p className="mt-3 text-sm text-[#9CA3AF]">
                Loading admin context…
              </p>
            ) : context ? (
              <div className="mt-4 text-sm text-slate-200 space-y-1">
                <p>Services: {summary.sCount}</p>
                <p>Payment methods: {summary.pCount}</p>
                <p>Work positions: {summary.wCount}</p>
              </div>
            ) : (
              <div className="mt-4 text-sm text-slate-200 space-y-2">
                <p className="text-amber-200">
                  ⚠️ JarvisX AI is not configured yet.
                </p>
                <p className="text-xs text-slate-400">
                  Add GROQ_API_KEY in Render/Vercel env to enable AI responses.
                  <br />
                  For now, rule-based responses will be used.
                </p>
              </div>
            )}
          </Card>

          <Card title="Chat">
            <div className="space-y-4">
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                {messages.map((m) => (
                  <div key={m.id}>
                    <p className="text-xs text-slate-500">
                      {m.role === "user" ? "You" : "JarvisX"}
                    </p>
                    <div className="mt-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 whitespace-pre-wrap">
                      {m.text}
                    </div>

                    {m.role === "assistant" && (
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {m.meta?.sources && m.meta.sources.length > 0 && (
                          <span className="text-[11px] text-slate-400">
                            Sources: {m.meta.sources.join(", ")}
                          </span>
                        )}

                        {m.meta?.actions && m.meta.actions.length > 0 && (
                          <span className="text-[11px] text-slate-400">
                            Actions:{" "}
                            {m.meta.actions
                              .slice(0, 3)
                              .map((a) => a.label)
                              .join(", ")}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") send();
                  }}
                  placeholder={
                    sending ? "Sending…" : "Ask JarvisX (admin mode)…"
                  }
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-blue-500/30"
                  disabled={sending}
                />
                <button
                  type="button"
                  onClick={send}
                  disabled={sending || !input.trim()}
                  className="rounded-2xl px-4 py-3 text-sm font-semibold border border-white/10 bg-white/10 hover:bg-white/15 text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </div>
          </Card>
        </>
      )}

      {tab === "proposals" && (
        <>
          <Card title="Command">
            <div className="space-y-3">
              <textarea
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Tell Jarvis what to do… (e.g., Add new service Handshake AI screening for $20, then upload hero image URL ...)"
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
                  Safety: JarvisX only proposes actions. Nothing executes until
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
                      activeProposal.status
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

                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <p className="text-xs text-slate-500">Edit actions (JSON)</p>
                  <textarea
                    value={actionsDraft}
                    onChange={(e) => setActionsDraft(e.target.value)}
                    className="mt-2 w-full min-h-[180px] rounded-2xl border border-white/10 bg-[#020617]/70 px-4 py-3 text-xs text-slate-200 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-blue-500/30"
                    disabled={
                      activeProposal.status !== "pending" || savingEdits
                    }
                  />
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={saveEdits}
                      disabled={
                        activeProposal.status !== "pending" || savingEdits
                      }
                      className="rounded-2xl px-4 py-2 text-sm font-semibold border border-white/10 bg-white/10 hover:bg-white/15 text-white transition disabled:opacity-50"
                    >
                      {savingEdits ? "Saving…" : "Save Edits"}
                    </button>
                    <p className="text-xs text-slate-500">
                      Tip: Use this to fix IDs/fields before execution.
                    </p>
                  </div>
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
                            <span className="text-xs text-slate-400">
                              {a.note}
                            </span>
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
                      Success: {activeProposal.executionResult.successCount} ·
                      Fail: {activeProposal.executionResult.failCount}
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
                {loadingHistory ? "Refreshing…" : "Refresh"}
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
                            p.status
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
                            detailsProposal.status
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

                      {detailsProposal.undoActions?.length ? (
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                          <p className="text-xs text-slate-500">
                            Undo Actions (if supported)
                          </p>
                          <pre className="text-xs text-slate-300 overflow-x-auto">
                            {prettyJson(detailsProposal.undoActions)}
                          </pre>
                        </div>
                      ) : null}

                      {detailsProposal.executionResult ? (
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                          <p className="text-xs text-slate-500">
                            Execution Result
                          </p>
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
        </>
      )}

      {tab === "memory" && (
        <Card title="Jarvis Memory">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#9CA3AF]">
              Learns from approvals/rejections.
            </p>
            <button
              type="button"
              onClick={loadMemory}
              disabled={loadingMemories}
              className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 px-3 py-2 text-sm transition disabled:opacity-50"
            >
              {loadingMemories ? "Refreshing…" : "Refresh"}
            </button>
          </div>

          <div className="mt-4 space-y-2">
            {memories.length === 0 ? (
              <p className="text-sm text-[#9CA3AF]">No memories yet.</p>
            ) : (
              memories.slice(0, 100).map((m) => (
                <div
                  key={m._id}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">{m.source}</span>
                      <span className="text-xs text-slate-500">
                        c={Number(m.confidence || 0).toFixed(2)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteMemory(m._id)}
                      className="rounded-xl border border-red-400/20 bg-red-500/10 hover:bg-red-500/15 text-red-100 px-3 py-2 text-xs transition"
                    >
                      Delete
                    </button>
                  </div>

                  <p className="mt-2 text-xs text-slate-500">Trigger</p>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">
                    {String(m.triggerText || "").trim() || "—"}
                  </p>

                  <p className="mt-3 text-xs text-slate-500">
                    Correct response
                  </p>
                  <p className="text-sm text-slate-200 whitespace-pre-wrap">
                    {String(m.correctResponse || "").trim() || "—"}
                  </p>

                  <p className="mt-3 text-xs text-slate-500">
                    {new Date(m.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
