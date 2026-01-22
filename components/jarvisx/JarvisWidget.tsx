"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { jarvisxApi } from "@/lib/api/jarvisx";

type JarvisSuggestedAction = { label: string; url: string };

type JarvisReply = {
  ok?: boolean;
  message?: string;
  reply: string;
  confidence?: number;
  usedSources?: string[];
  suggestedActions?: JarvisSuggestedAction[];
  leadCapture?: { requestId?: string; step?: string };
  intent?: string;
  quickReplies?: string[];
  didCreateRequest?: boolean;
  customRequestDraft?: {
    sessionId?: string;
    platform?: string;
    requestType?: "KYC" | "ACCOUNT" | "OTHER";
    quantity?: number;
    unitPrice?: number;
    notes?: string;
  };
};

function scrubAdminGreetingForPublicWidget(text: string) {
  const raw = String(text || "");
  if (!raw) return raw;
  if (/\bYes boss\b/i.test(raw)) {
    console.warn(
      "JarvisX incorrectly returned admin greeting in public widget",
    );
    return raw
      .replace(/Yes boss\s*✅/gi, "Hello!")
      .replace(/\bYes boss\b/gi, "Hello");
  }
  return raw;
}

type JarvisContextPublic = {
  settings?: any;
  services?: any[];
  paymentMethods?: any[];
  workPositions?: any[];
  rules?: any;
};

type JarvisRequestServiceResponse = {
  success?: boolean;
  id?: string;
  message?: string;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  meta?: {
    sources?: string[];
    actions?: JarvisSuggestedAction[];
    quickReplies?: string[];
    intent?: string;
  };
};

function uuid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeText(s: string) {
  return String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseQtyFromText(text: string): number | null {
  const t = normalizeText(text);
  if (!t) return null;
  const m = t.match(
    /\b(?:x\s*)?(\d{1,4})\s*(?:accounts?|account|kyc|pcs?|pieces?)\b/,
  );
  if (m?.[1]) {
    const n = Number(m[1]);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  const m2 = t.match(/\bqty\s*[:=]?\s*(\d{1,4})\b/);
  if (m2?.[1]) {
    const n = Number(m2[1]);
    return Number.isFinite(n) && n > 0 ? n : null;
  }
  return null;
}

function parseUnitPriceFromText(text: string): number | null {
  const raw = String(text || "");
  const m = raw.match(/\$\s*(\d{1,6}(?:\.\d{1,2})?)/);
  if (m?.[1]) {
    const n = Number(m[1]);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }
  const m2 = raw.match(/\b(\d{1,6}(?:\.\d{1,2})?)\s*\$\b/);
  if (m2?.[1]) {
    const n = Number(m2[1]);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }
  return null;
}

function parseRequestTypeFromText(
  text: string,
): "KYC" | "ACCOUNT" | "OTHER" | null {
  const t = normalizeText(text);
  if (!t) return null;
  if (t.includes("kyc")) return "KYC";
  if (t.includes("ready") || t.includes("account") || t.includes("accounts"))
    return "ACCOUNT";
  return null;
}

function looksLikeServiceRequest(text: string) {
  const msg = normalizeText(text);
  if (!msg) return false;

  // PATCH_19: Exclude service listing queries - these should be handled by backend LIST_SERVICES intent
  const serviceListingPatterns =
    /(what services|which services|available services|show me services|list services|services available|what can i buy|can i buy|do you have|do you sell)/;
  if (serviceListingPatterns.test(msg)) return false;

  return (
    /(need|want|looking for|can you|help me|make|build|create)/.test(msg) &&
    /(service|website|app|bot|automation|marketing|design|branding|seo|ads|kyc)/.test(
      msg,
    )
  );
}

function extractDetectedServiceName(text: string) {
  const raw = String(text || "").trim();
  if (!raw) return "";

  const m1 = raw.match(
    /(?:need|want)\s+(.{3,80}?)(?:\s+service|\s+help|\.|\!|\?|$)/i,
  );
  if (m1?.[1]) return String(m1[1]).trim();

  const m2 = raw.match(/(?:looking for)\s+(.{3,80}?)(?:\.|\!|\?|$)/i);
  if (m2?.[1]) return String(m2[1]).trim();

  return "";
}

function messageMentionsKnownService(
  text: string,
  services: any[] | undefined,
) {
  const msg = normalizeText(text);
  if (!msg) return false;
  const list = Array.isArray(services) ? services : [];
  for (const s of list) {
    const title = String(s?.title || "").trim();
    if (!title) continue;
    const t = normalizeText(title);
    if (!t) continue;
    if (msg.includes(t) || t.includes(msg)) return true;
  }
  return false;
}

function buildGreetingFromContext(ctx: JarvisContextPublic | null) {
  const brand = String(ctx?.settings?.site?.brandName || "").trim();
  const support = ctx?.settings?.support || {};
  const whatsapp = String(support?.whatsappNumber || "").trim();
  const line1 = "Hi 👋 I’m JarvisX Support. Tell me what you need.";

  // Keep greeting short; just add one helpful hint if available.
  if (brand && whatsapp)
    return `${line1}\n\n${brand} support is available on WhatsApp too.`;
  if (brand)
    return `${line1}\n\nI can help with ${brand} services and payments.`;
  return line1;
}

export default function JarvisWidget() {
  const pathname = usePathname();

  const inferredOrderId = useMemo(() => {
    const p = String(pathname || "");
    const m = p.match(/^\/orders\/([a-f0-9]{24})(?:\/|$)/i);
    return m?.[1] ? String(m[1]) : "";
  }, [pathname]);

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
  const lastSendAtRef = useRef(0);
  const cooldownUntilRef = useRef(0);
  const lastAssistantSigRef = useRef<{ sig: string; at: number } | null>(null);
  const [leadRequestId, setLeadRequestId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const v = localStorage.getItem("jarvisx_lead_request_id");
    return v && v.trim() ? v : null;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (leadRequestId) {
      localStorage.setItem("jarvisx_lead_request_id", leadRequestId);
    } else {
      localStorage.removeItem("jarvisx_lead_request_id");
    }
  }, [leadRequestId]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: uuid(),
      role: "assistant",
      text: "Hi 👋 I’m JarvisX Support. Tell me what you need.",
    },
  ]);

  const [customServiceDraft, setCustomServiceDraft] = useState<{
    message: string;
    detectedServiceName?: string;
    sent?: boolean;
  } | null>(null);

  const [customRequestDraft, setCustomRequestDraft] = useState<{
    sessionId?: string;
    platform?: string;
    requestType?: "KYC" | "ACCOUNT" | "OTHER";
    quantity?: number;
    unitPrice?: number;
    notes?: string;
    submitted?: boolean;
  } | null>(null);

  const [customRequestSubmitting, setCustomRequestSubmitting] = useState(false);
  const customRequestCooldownUntilRef = useRef(0);

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
        "GET",
      );
      setContext(ctx);

      // Upgrade greeting once we have CMS/support settings (only if user hasn't chatted yet).
      setMessages((prev) => {
        if (prev.length !== 1) return prev;
        if (prev[0]?.role !== "assistant") return prev;
        return [{ ...prev[0], text: buildGreetingFromContext(ctx) }];
      });
    } catch {
      setContext(null);
    } finally {
      setLoadingContext(false);
    }
  };

  const requestServiceToAdmin = async (payload: {
    message: string;
    detectedServiceName?: string;
  }) => {
    try {
      await apiRequest<JarvisRequestServiceResponse>(
        "/api/jarvisx/request-service",
        "POST",
        {
          message: payload.message,
          detectedServiceName: payload.detectedServiceName || "",
          page: pathname || "",
        },
      );
    } catch {
      // Never surface request capture failures to the user.
    }
  };

  const submitCustomRequestToAdmin = async (draft: {
    sessionId?: string;
    platform?: string;
    requestType?: "KYC" | "ACCOUNT" | "OTHER";
    quantity?: number;
    unitPrice?: number;
    notes?: string;
  }) => {
    const now = Date.now();
    if (customRequestSubmitting) return;
    if (now < customRequestCooldownUntilRef.current) return;

    const platform = String(draft.platform || "").trim();
    if (!platform) return;

    setCustomRequestSubmitting(true);
    try {
      const res = await apiRequest<{
        ok?: boolean;
        message?: string;
        requestId?: string;
      }>("/api/jarvisx/custom-request", "POST", {
        sessionId: String(draft.sessionId || ""),
        platform,
        requestType: draft.requestType || "OTHER",
        quantity: draft.quantity || 1,
        unitPrice: typeof draft.unitPrice === "number" ? draft.unitPrice : null,
        notes: String(draft.notes || "").trim(),
      });

      const ok = !!res?.ok;
      const msg =
        String(res?.message || "").trim() ||
        (ok ? "Request sent to admin ✅" : "Unable to send request.");

      setMessages((prev) => [
        ...prev,
        { id: uuid(), role: "assistant", text: msg },
      ]);

      if (ok) {
        setCustomRequestDraft((prev) =>
          prev ? { ...prev, submitted: true } : prev,
        );
        customRequestCooldownUntilRef.current = Date.now() + 2500;
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: uuid(),
          role: "assistant",
          text: "Couldn’t submit that right now. Please try again.",
        },
      ]);
      customRequestCooldownUntilRef.current = Date.now() + 2500;
    } finally {
      setCustomRequestSubmitting(false);
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

  const sendText = async (rawText: string) => {
    const text = String(rawText || "").trim();
    if (!text || sending) return;

    // Prevent spam loops during backend/provider outages.
    const now = Date.now();
    if (now < cooldownUntilRef.current) return;

    // Prevent accidental double-send (Enter + click, double tap, etc.)
    if (now - lastSendAtRef.current < 450) return;
    lastSendAtRef.current = now;

    setInput("");

    // Minimal custom request flow (local draft collection; avoids backend template loops).
    if (customRequestDraft && !customRequestDraft.submitted) {
      const t = normalizeText(text);
      if (
        t === "cancel" ||
        t === "stop" ||
        t === "never mind" ||
        t === "nevermind"
      ) {
        setCustomRequestDraft(null);
        setMessages((prev) => [
          ...prev,
          { id: uuid(), role: "user", text },
          {
            id: uuid(),
            role: "assistant",
            text: "Okay — cancelled. What else can I help you with?",
          },
        ]);
        return;
      }

      const userMsg: ChatMessage = { id: uuid(), role: "user", text };
      setMessages((prev) => [...prev, userMsg]);

      const nextDraft = (() => {
        const cur = customRequestDraft || {};
        const next: any = { ...cur };

        const type = parseRequestTypeFromText(text);
        if (!next.requestType && type) next.requestType = type;

        const qty = parseQtyFromText(text);
        if (!next.quantity && qty) next.quantity = qty;

        const price = parseUnitPriceFromText(text);
        if (next.unitPrice == null && price != null) next.unitPrice = price;

        const notes = String(next.notes || "").trim();
        const add = String(text || "").trim();
        next.notes = notes ? `${notes}\n${add}` : add;
        return next;
      })();

      setCustomRequestDraft(nextDraft);

      let prompt = "";
      if (!nextDraft.requestType) {
        prompt = "Is this for KYC or a ready account?";
      } else if (!nextDraft.quantity) {
        prompt = "How many do you need?";
      } else if (nextDraft.unitPrice == null) {
        prompt = "What’s your target price per account? (e.g., $8)";
      } else {
        prompt = "Perfect ✅ Tap ‘Create request to Admin’ to send it.";
      }

      if (prompt) {
        setMessages((prev) => [
          ...prev,
          { id: uuid(), role: "assistant", text: prompt },
        ]);
      }

      return;
    }

    const userMsg: ChatMessage = { id: uuid(), role: "user", text };
    setMessages((prev) => [...prev, userMsg]);

    // Detect custom service requests and offer a UI action + backend capture.
    const knownService = messageMentionsKnownService(text, context?.services);
    const customIntent = looksLikeServiceRequest(text) && !knownService;
    const detectedServiceName = extractDetectedServiceName(text);

    if (customIntent && !leadRequestId) {
      const draft = {
        message: text,
        detectedServiceName: detectedServiceName || undefined,
        sent: false,
      };
      setCustomServiceDraft(draft);

      // Capture in backend (fire-and-forget). The UI button is optional.
      requestServiceToAdmin({
        message: draft.message,
        detectedServiceName: draft.detectedServiceName,
      }).finally(() => {
        setCustomServiceDraft((prev) =>
          prev && prev.message === draft.message
            ? { ...prev, sent: true }
            : prev,
        );
      });
    }

    setSending(true);
    try {
      const res = (await jarvisxApi.sendMessage({
        message: text,
        mode: "public",
        meta: {
          page: pathname || "",
          orderId: inferredOrderId || undefined,
          leadCapture: leadRequestId ? { requestId: leadRequestId } : undefined,
        },
      })) as unknown as JarvisReply;

      const nextId = String(res?.leadCapture?.requestId || "").trim();
      const step = String(res?.leadCapture?.step || "").trim();
      if (nextId) setLeadRequestId(nextId);
      if (step === "created" || step === "cancelled") setLeadRequestId(null);

      const assistantMsg: ChatMessage = {
        id: uuid(),
        role: "assistant",
        text:
          scrubAdminGreetingForPublicWidget(String(res?.reply || "").trim()) ||
          "I can help with services, payments, and interview support. What do you need?",
        meta: {
          sources: Array.isArray(res?.usedSources) ? res.usedSources : [],
          actions: Array.isArray(res?.suggestedActions)
            ? res.suggestedActions
            : [],
          quickReplies: Array.isArray(res?.quickReplies)
            ? Array.from(
                new Set(
                  res.quickReplies
                    .map((q) => String(q || "").trim())
                    .filter(Boolean),
                ),
              ).slice(0, 6)
            : [],
          intent: String(res?.intent || "").trim() || undefined,
        },
      };

      // Replace quickReplies (never append duplicates across messages)
      // and dedupe accidental duplicate assistant messages within 1s.
      const sig = `assistant:${assistantMsg.text}`;
      const last = lastAssistantSigRef.current;
      if (last && last.sig === sig && now - last.at < 1000) {
        return;
      }
      lastAssistantSigRef.current = { sig, at: now };

      setMessages((prev) => {
        const cleared = prev.map((m) =>
          m.role === "assistant"
            ? { ...m, meta: { ...(m.meta || {}), quickReplies: [] } }
            : m,
        );
        return [...cleared, assistantMsg];
      });

      // If backend started a custom request flow, store the draft and show CTA.
      if (
        res?.intent === "SERVICE_PURCHASE_REQUEST" &&
        res?.customRequestDraft
      ) {
        setCustomRequestDraft({
          sessionId: res.customRequestDraft.sessionId,
          platform: res.customRequestDraft.platform,
          requestType: res.customRequestDraft.requestType,
          quantity: res.customRequestDraft.quantity,
          unitPrice: res.customRequestDraft.unitPrice,
          notes: "",
          submitted: false,
        });
      }

      // If backend says ok:false, apply a brief cooldown to avoid rapid retries.
      if (res?.ok === false) {
        cooldownUntilRef.current = Date.now() + 3000;
      }
    } catch (err: any) {
      // Never show raw provider/server errors in the UI.
      cooldownUntilRef.current = Date.now() + 3000;
      const fallback: ChatMessage = {
        id: uuid(),
        role: "assistant",
        text: "Network error — please try again.",
      };
      setMessages((prev) => {
        const cleared = prev.map((m) =>
          m.role === "assistant"
            ? { ...m, meta: { ...(m.meta || {}), quickReplies: [] } }
            : m,
        );
        return [...cleared, fallback];
      });
    } finally {
      setSending(false);
    }
  };

  const send = async () => sendText(input);

  const onQuickReply = (messageId: string, replyText: string) => {
    // Prevent double-clicks while sending.
    if (sending) return;

    // Hide quick replies on the message once used.
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId
          ? { ...m, meta: { ...(m.meta || {}), quickReplies: [] } }
          : m,
      ),
    );

    sendText(replyText);
  };

  if (shouldHide) return null;

  return (
    <div className="fixed bottom-5 right-5 z-[99999] pointer-events-auto">
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

                  {m.role === "assistant" &&
                    m.meta?.quickReplies &&
                    m.meta.quickReplies.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {m.meta.quickReplies.slice(0, 6).map((qr) => (
                          <button
                            key={`${m.id}-qr-${qr}`}
                            type="button"
                            disabled={sending}
                            onClick={() => onQuickReply(m.id, qr)}
                            className="text-xs rounded-full border border-white/10 bg-white/10 hover:bg-white/15 px-3 py-1 text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {qr}
                          </button>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            ))}

            {customServiceDraft && (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs text-slate-300">
                  Need a custom service? I can create a request for the admin.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    style={{
                      pointerEvents: "auto",
                      position: "relative",
                      zIndex: 9999,
                    }}
                    className="text-xs rounded-full border border-white/10 bg-white/10 hover:bg-white/15 px-3 py-1 text-white transition"
                    onClick={() =>
                      requestServiceToAdmin({
                        message: customServiceDraft.message,
                        detectedServiceName:
                          customServiceDraft.detectedServiceName,
                      })
                    }
                  >
                    Create request to Admin
                  </button>
                  <span className="text-[11px] text-slate-500">
                    {customServiceDraft.sent ? "Captured ✅" : "Capturing…"}
                  </span>
                </div>
              </div>
            )}

            {customRequestDraft && !customRequestDraft.submitted && (
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                <p className="text-xs text-slate-300">
                  Custom request to admin is ready when you are.
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      submitCustomRequestToAdmin(customRequestDraft)
                    }
                    disabled={
                      customRequestSubmitting ||
                      !String(customRequestDraft.platform || "").trim()
                    }
                    style={{
                      pointerEvents: "auto",
                      position: "relative",
                      zIndex: 9999,
                    }}
                    className="text-xs rounded-full border border-white/10 bg-white/10 hover:bg-white/15 px-3 py-1 text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    Create request to Admin
                  </button>
                  <span className="text-[11px] text-slate-500">
                    {customRequestSubmitting ? "Sending…" : ""}
                  </span>
                </div>
              </div>
            )}
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
              Tip: If you request something not listed, JarvisX will ask a few
              quick questions and create a request ID for the team.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
