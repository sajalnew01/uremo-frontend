"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { useRequireAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store";
import { Badge } from "@/design-system";
import { emitToast } from "@/hooks/useToast";
import Link from "next/link";
import type { Ticket, TicketMessage } from "@/types";

export default function TicketDetailPage() {
  const ready = useRequireAuth();
  const params = useParams();
  const id = params.id as string;
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: ticketData, isLoading } = useQuery<{ ticket: Ticket }>({
    queryKey: ["ticket", id],
    queryFn: () => apiRequest(EP.TICKET_BY_ID(id), "GET", undefined, true),
    enabled: ready && !!id,
  });

  const { data: messagesData } = useQuery<{ messages: TicketMessage[] }>({
    queryKey: ["ticket-messages", id],
    queryFn: () => apiRequest(EP.TICKET_MESSAGES(id), "GET", undefined, true),
    enabled: ready && !!id,
    refetchInterval: 15_000,
  });

  const replyMutation = useMutation({
    mutationFn: () =>
      apiRequest(EP.TICKET_REPLY(id), "POST", { message }, true),
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["ticket-messages", id] });
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  const messages = messagesData?.messages || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  if (!ready) return null;

  const ticket = ticketData?.ticket;

  if (isLoading) {
    return <div className="page-content"><div className="page-loading"><div className="u-spinner" /> Loading...</div></div>;
  }

  if (!ticket) {
    return <div className="page-content"><div className="page-empty">Ticket not found.</div></div>;
  }

  const isClosed = ticket.status === "closed" || ticket.status === "resolved";

  return (
    <div className="page-content" style={{ maxWidth: 800 }}>
      <Link href="/support" style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-4)", display: "inline-block" }}>
        ← Back to Support
      </Link>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-6)" }}>
        <div>
          <h1 className="page-title">{ticket.subject}</h1>
          <div style={{ display: "flex", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
            <Badge status={ticket.status} />
            <Badge status={ticket.priority} size="sm" />
            <Badge status={ticket.category} size="sm" />
          </div>
        </div>
        <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
          {new Date(ticket.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Messages */}
      <div className="chat-container" style={{ height: 500 }}>
        <div className="chat-messages">
          {messages.length === 0 ? (
            <div style={{ textAlign: "center", color: "var(--color-text-tertiary)", padding: "var(--space-8) 0" }}>
              No messages yet.
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.senderRole === "user";
              return (
                <div
                  key={msg._id}
                  className={`chat-bubble ${isUser ? "chat-bubble-user" : "chat-bubble-admin"}`}
                >
                  <div style={{ fontSize: "var(--text-xs)", fontWeight: "var(--weight-semibold)", marginBottom: "var(--space-1)", opacity: 0.7 }}>
                    {isUser ? "You" : "Support"}
                  </div>
                  <div>{msg.message}</div>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div style={{ marginTop: "var(--space-2)" }}>
                      {msg.attachments.map((att, j) => (
                        <a key={j} href={att.url} target="_blank" rel="noreferrer" style={{ fontSize: "var(--text-xs)" }}>
                          📎 {att.filename}
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="chat-bubble-time">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        {!isClosed && (
          <form
            className="chat-input-bar"
            onSubmit={(e) => { e.preventDefault(); if (message.trim()) replyMutation.mutate(); }}
          >
            <input
              className="u-input"
              placeholder="Type your reply..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              type="submit"
              className="u-btn u-btn-primary"
              disabled={replyMutation.isPending || !message.trim()}
            >
              Send
            </button>
          </form>
        )}
        {isClosed && (
          <div style={{ padding: "var(--space-3)", textAlign: "center", fontSize: "var(--text-sm)", color: "var(--color-text-tertiary)", borderTop: "1px solid var(--color-border)" }}>
            This ticket is {ticket.status}. Create a new ticket if you need more help.
          </div>
        )}
      </div>
    </div>
  );
}
