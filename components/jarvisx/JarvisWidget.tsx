"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { apiRequest } from "@/lib/api";

type JarvisSuggestedAction = { label: string; url: string };

type JarvisReply = {
  reply: string;
  confidence: number;
  usedSources: string[];
  suggestedActions: JarvisSuggestedAction[];
};

type JarvisContextPublic = {
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

export default function JarvisWidget() {
  const pathname = usePathname();

  // Hide on auth pages and admin pages (admin has its own command center).
  const shouldHide = useMemo(() => {
    const p = String(pathname || "");
    if (p.startsWith("/admin")) return true;
    if (p.startsWith("/login") || p.startsWith("/signup")) return true;
    return false;
  }, [pathname]);

  const [open, setOpen] = useState(false);
  const [loadingContext, setLoadingContext] = useState(false);
  const [context, setContext] = useState<JarvisContextPublic | null>(null);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: uuid(),
      role: "assistant",
      text: "JarvisX Support — ask me about services, payments, or orders.",
    },
  ]);

  const listRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  };

  useEffect(() => {
    if (!open) return;
    scrollToBottom();
  }, [open, messages.length]);

  const loadContext = async () => {
    if (loadingContext) return;
    setLoadingContext(true);
    try {
      const ctx = await apiRequest<JarvisContextPublic>(
        "/api/jarvisx/context/public",
        "GET"
      );
      setContext(ctx);
    } catch {
      setContext(null);
    } finally {
      setLoadingContext(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    if (context) return;
    loadContext();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const quickHint = useMemo(() => {
    const brand = String(context?.settings?.site?.brandName || "UREMO");
    const serviceCount = Array.isArray(context?.services)
      ? context!.services!.length
      : null;

    if (loadingContext) return "Loading context…";
    if (serviceCount != null)
      return `${brand} context loaded (${serviceCount} services).`;
    return `${brand} support brain is ready.`;
  }, [context, loadingContext]);

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
        mode: "public",
        meta: { page: pathname || "" },
      });

      const assistantMsg: ChatMessage = {
        id: uuid(),
        role: "assistant",
        text:
          String(res?.reply || "").trim() ||
          "I’m not sure. Please contact admin in Order Support Chat.",
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
          text:
            err?.message ||
            "I’m not sure. Please contact admin in Order Support Chat.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  if (shouldHide) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999]">
      {/* Bubble */}
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group flex items-center gap-3 rounded-full border border-white/10 bg-[#020617]/95 backdrop-blur px-4 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.45)] hover:bg-[#0b1224] transition"
          aria-label="Open JarvisX Support"
        >
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 border border-white/10 text-white font-semibold">
            JX
          </span>
          <div className="text-left">
            <p className="text-sm text-white font-semibold leading-tight">
              JarvisX
            </p>
            <p className="text-xs text-slate-400 leading-tight">Support</p>
          </div>
          <span className="text-slate-400 group-hover:text-slate-300">▴</span>
        </button>
      )}

      {/* Drawer */}
      {open && (
        <div className="w-[92vw] max-w-[420px] h-[70vh] max-h-[560px] rounded-3xl border border-white/10 bg-[#020617]/95 backdrop-blur shadow-[0_18px_60px_rgba(0,0,0,0.55)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div>
              <p className="text-white font-semibold">JarvisX Support</p>
              <p className="text-xs text-slate-400">{quickHint}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 px-3 py-2 text-sm transition"
            >
              Close
            </button>
          </div>

          <div
            ref={listRef}
            className="px-4 py-4 space-y-3 overflow-y-auto h-[calc(70vh-56px-70px)] max-h-[calc(560px-56px-70px)]"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 border text-sm whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-blue-500/15 border-blue-400/20 text-slate-100"
                      : "bg-white/5 border-white/10 text-slate-200"
                  }`}
                >
                  {m.text}

                  {m.role === "assistant" &&
                    m.meta?.actions &&
                    m.meta.actions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {m.meta.actions.slice(0, 3).map((a) => (
                          <a
                            key={`${m.id}-${a.url}`}
                            href={a.url}
                            className="text-xs rounded-full border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1 text-slate-200 transition"
                          >
                            {a.label}
                          </a>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            ))}
          </div>

          <div className="px-4 py-4 border-t border-white/10">
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
                placeholder={sending ? "Sending…" : "Ask JarvisX…"}
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
            <p className="mt-2 text-[11px] text-slate-500">
              Read-only assistant. If unsure, it will redirect to Order Support
              Chat.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
