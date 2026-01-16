"use client";

import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { ChatMessage, MessageStatus } from "@/hooks/useChatSocket";

type ChatConnection = "open" | "connecting" | "offline";

type TypingUser = { role: string };

type Props = {
  ui: {
    chatTitle: string;
    chatSubtitle: string;
    emptyChatTitle: string;
    emptyChatSubtitle: string;
    youLabel: string;
    supportLabel: string;
    chatInputPlaceholder: string;
    sendButtonText: string;
    sendingButtonText: string;
    supportRepliesHint: string;
  };

  quickReplies: string[];
  messages: ChatMessage[];
  typingUsers: TypingUser[];
  connection: ChatConnection;

  authReady: boolean;
  isAuthenticated: boolean;
  sending: boolean;

  getSenderRole: (m: ChatMessage) => "user" | "admin";
  onSend: (text: string) => void;
  onRetry: (tempId: string) => void;
  onReconnect: () => void;
  onStartTyping: () => void;
};

function formatTime(input: string) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString();
}

function getMessageKey(m: Partial<ChatMessage>, index: number) {
  const anyMsg = m as any;
  const id = anyMsg?._id || anyMsg?.id || anyMsg?.tempId;
  if (id) return String(id);
  const createdAt = anyMsg?.createdAt ? String(anyMsg.createdAt) : "";
  return `${createdAt}-${index}`;
}

function uniqStrings(list: string[]) {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const raw of list) {
    const v = String(raw || "").trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

function isNearBottom(el: HTMLElement, thresholdPx = 120) {
  const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
  return distance <= thresholdPx;
}

function scrollToBottom(el: HTMLElement) {
  el.scrollTop = el.scrollHeight;
}

function getStatusIcon(status: MessageStatus): string | null {
  switch (status) {
    case "sending":
      return "⏳";
    case "sent":
      return "✓";
    case "delivered":
      return "✓✓";
    case "seen":
      return "✓✓";
    case "failed":
      return "⚠️";
    default:
      return null;
  }
}

function getStatusClass(status: MessageStatus): string {
  switch (status) {
    case "sending":
      return "text-slate-400";
    case "sent":
      return "text-slate-400";
    case "delivered":
      return "text-blue-400";
    case "seen":
      return "text-emerald-400";
    case "failed":
      return "text-red-400";
    default:
      return "text-slate-400";
  }
}

const MessageList = memo(function MessageList(props: {
  messages: ChatMessage[];
  getSenderRole: (m: ChatMessage) => "user" | "admin";
  youLabel: string;
  supportLabel: string;
  onRetry: (tempId: string) => void;
  onUserScrolledNearBottomChange: (near: boolean) => void;
}) {
  const {
    messages,
    getSenderRole,
    youLabel,
    supportLabel,
    onRetry,
    onUserScrolledNearBottomChange,
  } = props;

  const listRef = useRef<HTMLDivElement | null>(null);
  const shouldAutoScrollRef = useRef(true);

  const handleScroll = useCallback(() => {
    const el = listRef.current;
    if (!el) return;
    const near = isNearBottom(el);
    shouldAutoScrollRef.current = near;
    onUserScrolledNearBottomChange(near);
  }, [onUserScrolledNearBottomChange]);

  // Auto-scroll when new messages arrive, but only if user is already near bottom.
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    if (!shouldAutoScrollRef.current) return;
    scrollToBottom(el);
  }, [messages.length]);

  return (
    <div
      ref={listRef}
      onScroll={handleScroll}
      className="flex-1 min-h-0 overflow-y-auto overscroll-contain rounded-xl border border-slate-700/50 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-800/40 p-4"
    >
      <div className="space-y-4">
        {messages.map((m, index) => {
          const role = getSenderRole(m);
          const isUser = role === "user";

          return (
            <div
              key={getMessageKey(m, index)}
              className={`flex ${isUser ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`flex flex-col gap-1 ${
                  isUser ? "items-end" : "items-start"
                } max-w-[75%]`}
              >
                <p className="text-[11px] text-slate-400">
                  {isUser ? youLabel : supportLabel}
                </p>

                <div
                  className={`rounded-2xl px-4 py-2 text-sm ${
                    isUser
                      ? m.status === "failed"
                        ? "bg-red-600/50 text-white border border-red-500"
                        : "bg-blue-600 text-white"
                      : "bg-slate-800 text-slate-100 border border-slate-700"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word]">
                    {m.message}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <p
                    className={`text-xs text-slate-400 ${
                      isUser ? "text-right" : "text-left"
                    }`}
                  >
                    {formatTime(m.createdAt)}
                  </p>

                  {isUser && m.status && (
                    <span
                      className={`text-xs ${getStatusClass(m.status)}`}
                      title={m.status}
                    >
                      {getStatusIcon(m.status)}
                    </span>
                  )}

                  {m.status === "failed" && m.tempId && (
                    <button
                      type="button"
                      onClick={() => onRetry(m.tempId!)}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Retry
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

export default function OrderSupportChat(props: Props) {
  const {
    ui,
    quickReplies,
    messages,
    typingUsers,
    connection,
    authReady,
    isAuthenticated,
    sending,
    getSenderRole,
    onSend,
    onRetry,
    onReconnect,
    onStartTyping,
  } = props;

  const safeQuickReplies = useMemo(
    () => uniqStrings(Array.isArray(quickReplies) ? quickReplies : []),
    [quickReplies]
  );

  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [userNearBottom, setUserNearBottom] = useState(true);

  const showQuickReplies = safeQuickReplies.length > 0;

  const handleSend = useCallback(
    (raw?: string) => {
      const next = (raw ?? text).trim();
      if (!next) return;
      if (!authReady || !isAuthenticated) return;

      onSend(next);
      setText("");

      // Keep typing UX consistent on mobile.
      window.setTimeout(() => inputRef.current?.focus(), 0);
    },
    [authReady, isAuthenticated, onSend, text]
  );

  const handleQuickReply = useCallback(
    (q: string) => {
      // If user can send immediately, do it. Otherwise just fill input.
      if (authReady && isAuthenticated && !sending) {
        handleSend(q);
        return;
      }
      setText(q);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    },
    [authReady, handleSend, isAuthenticated, sending]
  );

  // If the user is at the bottom, keep focus/scroll experience smooth when they type.
  useEffect(() => {
    if (!userNearBottom) return;
    // no-op: this is just here to ensure we don't accidentally add scrolling tied to keystrokes
  }, [userNearBottom, text]);

  return (
    <div className="relative">
      {/* Connection status: small, top-right, never blocks UI */}
      <div className="absolute right-0 top-0">
        <div
          className={`text-[11px] px-2 py-1 rounded-full border ${
            connection === "open"
              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
              : connection === "connecting"
              ? "border-blue-500/25 bg-blue-500/10 text-blue-200"
              : "border-white/10 bg-white/5 text-[#9CA3AF]"
          }`}
        >
          {connection === "open"
            ? "🟢 Live"
            : connection === "connecting"
            ? "Connecting…"
            : "Offline"}
        </div>
      </div>

      <div>
        <h3 className="font-semibold text-lg">{ui.chatTitle}</h3>
        <p className="text-xs text-[#9CA3AF] mt-1">{ui.chatSubtitle}</p>
      </div>

      {typingUsers.length > 0 && (
        <div className="mt-2 text-xs text-slate-400 animate-pulse">
          {typingUsers.map((t) => t.role).join(", ")} typing...
        </div>
      )}

      {/* Fixed-height, flex chat layout (mobile-first).
          Use `dvh` so the layout responds to mobile keyboard resizing. */}
      <div className="mt-4 flex flex-col min-h-0 overflow-hidden h-[70vh] h-[70dvh] max-h-[520px]">
        {messages.length === 0 ? (
          <div className="flex-1 min-h-0 rounded-xl border border-slate-700/50 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-slate-800/40 p-4 flex items-center justify-center">
            <div className="text-center max-w-sm">
              <div className="mx-auto w-14 h-14 rounded-2xl border border-blue-500/20 bg-blue-500/10 flex items-center justify-center text-2xl text-blue-300">
                💬
              </div>
              <p className="mt-4 text-sm text-slate-200 font-medium">
                {ui.emptyChatTitle}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {ui.emptyChatSubtitle}
              </p>

              {showQuickReplies && (
                <div className="mt-5 shrink-0 overflow-x-auto">
                  <div className="flex gap-2 w-max mx-auto">
                    {safeQuickReplies.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => handleQuickReply(q)}
                        className="shrink-0 px-3 py-1.5 rounded-full text-xs border border-blue-500/20 bg-blue-500/10 text-blue-200 hover:bg-blue-500/20 transition"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <MessageList
            messages={messages}
            getSenderRole={getSenderRole}
            youLabel={ui.youLabel}
            supportLabel={ui.supportLabel}
            onRetry={onRetry}
            onUserScrolledNearBottomChange={setUserNearBottom}
          />
        )}

        {/* Quick replies (single place, horizontal scroll) */}
        {messages.length > 0 && showQuickReplies && (
          <div className="mt-3 shrink-0 overflow-x-auto">
            <div className="flex gap-2 w-max">
              {safeQuickReplies.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleQuickReply(q)}
                  className="shrink-0 px-3 py-1.5 rounded-full text-xs border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input bar (separate from scroll area; sticky-ish UX) */}
        <div className="mt-3 shrink-0">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 flex gap-2">
              <button
                type="button"
                disabled
                aria-label="Attach file (coming soon)"
                className="shrink-0 w-10 h-10 rounded-lg border border-white/10 bg-white/5 text-slate-200 opacity-60"
                title="File uploads coming soon"
              >
                📎
              </button>
              <input
                ref={inputRef}
                className="w-full rounded-lg border border-[#1F2937] bg-[#020617] px-3 py-2 text-sm text-white placeholder:text-[#64748B]"
                placeholder={ui.chatInputPlaceholder}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  onStartTyping();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={sending}
              />
            </div>

            <div className="flex gap-2">
              {connection !== "open" && (
                <button
                  type="button"
                  onClick={onReconnect}
                  className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-slate-200 text-sm hover:bg-white/10"
                >
                  Retry
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={
                  sending || !text.trim() || !authReady || !isAuthenticated
                }
                className="px-4 py-2 rounded-lg bg-[#3B82F6] text-white text-sm disabled:opacity-50 w-full sm:w-auto"
              >
                {sending ? ui.sendingButtonText : ui.sendButtonText}
              </button>
            </div>
          </div>

          <p className="mt-3 text-xs text-[#9CA3AF]">{ui.supportRepliesHint}</p>
        </div>
      </div>
    </div>
  );
}
