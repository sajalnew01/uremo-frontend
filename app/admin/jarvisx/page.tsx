"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/Card";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

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

function uuid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function AdminJarvisXPage() {
  const { user, isAuthenticated } = useAuth();

  const isAdmin = String((user as any)?.role || "") === "admin";

  const [context, setContext] = useState<AdminContext | null>(null);
  const [loadingContext, setLoadingContext] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: uuid(),
      role: "assistant",
      text: "Yes boss ✅ I'm listening. Tell me what to do.",
    },
  ]);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const load = async () => {
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

    if (!isAuthenticated) return;
    if (!isAdmin) return;
    load();
  }, [isAuthenticated, isAdmin]);

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

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    const userMsg: ChatMessage = { id: uuid(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);

    setSending(true);
    try {
      const res = await apiRequest<JarvisReply>("/api/jarvisx/chat", "POST", {
        message: text,
        mode: "admin",
        meta: { page: "/admin/jarvisx" },
      });

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
      // Don't show raw error in admin panel - graceful fallback
      const errMsg = String(err?.message || "").toLowerCase();
      const isApiKeyError =
        errMsg.includes("api") ||
        errMsg.includes("key") ||
        errMsg.includes("configured");

      setMessages((prev) => [
        ...prev,
        {
          id: uuid(),
          role: "assistant",
          text: isApiKeyError
            ? "JarvisX AI is not configured yet. Add API key in Render/Vercel env to enable AI mode."
            : "Got it, boss. I'll look into that.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold">JarvisX</h1>
        <p className="text-[#9CA3AF] mt-2">Please log in as admin.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold">JarvisX</h1>
        <p className="text-[#9CA3AF] mt-2">Admin access required.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">JarvisX Command Center</h1>
        <p className="text-[#9CA3AF]">Admin Read-Only Mode</p>
      </div>

      <Card title="Context">
        {loadingContext ? (
          <p className="text-sm text-[#9CA3AF]">Loading admin context…</p>
        ) : context ? (
          <div className="text-sm text-slate-200 space-y-1">
            <p>Services: {summary.sCount}</p>
            <p>Payment methods: {summary.pCount}</p>
            <p>Work positions: {summary.wCount}</p>
            <p className="text-xs text-slate-400 mt-2">
              Read-only mode. Use JarvisX Write for actions.
            </p>
          </div>
        ) : (
          <div className="text-sm text-slate-200 space-y-2">
            <p className="text-amber-200">
              ⚠️ JarvisX AI is not configured yet.
            </p>
            <p className="text-xs text-slate-400">
              Add JARVISX_API_KEY in Render/Vercel env to enable AI responses.
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
              placeholder={sending ? "Sending…" : "Ask JarvisX (admin mode)…"}
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
    </div>
  );
}
