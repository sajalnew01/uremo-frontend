"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  _id: string;
  senderType: "user" | "admin";
  sender: { firstName?: string; lastName?: string; email?: string };
  message: string;
  attachment?: string;
  attachmentType?: string;
  createdAt: string;
}

interface Ticket {
  _id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  order?: { _id: string; orderNumber: string };
  user: { firstName?: string; lastName?: string; email?: string };
}

const statusColor = (status: string) => {
  switch (status) {
    case "open":
      return "bg-blue-600";
    case "in_progress":
      return "bg-yellow-600";
    case "closed":
      return "bg-gray-600";
    default:
      return "bg-gray-600";
  }
};

const priorityColor = (priority: string) => {
  switch (priority) {
    case "high":
      return "text-red-400";
    case "medium":
      return "text-yellow-400";
    case "low":
      return "text-green-400";
    default:
      return "text-gray-400";
  }
};

export default function TicketViewPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const ticketId = params.id as string;

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadTicket = async () => {
    try {
      const [ticketRes, messagesRes] = await Promise.all([
        apiRequest<any>(`/api/tickets/${ticketId}`, "GET", null, true),
        apiRequest<any>(`/api/tickets/${ticketId}/messages`, "GET", null, true),
      ]);

      if (ticketRes.ok && ticketRes.ticket) {
        setTicket(ticketRes.ticket);
      } else {
        toast("Ticket not found", "error");
        router.push("/support/tickets");
        return;
      }

      if (messagesRes.ok) {
        setMessages(messagesRes.messages || []);
      }
    } catch (err) {
      console.error(err);
      toast("Failed to load ticket", "error");
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    if (ticket?.status === "closed") {
      toast("Cannot reply to a closed ticket", "error");
      return;
    }

    setSending(true);
    try {
      const res = await apiRequest<any>(
        `/api/tickets/${ticketId}/reply`,
        "POST",
        { message: reply },
        true,
      );

      if (res.ok && res.message) {
        setMessages((prev) => [...prev, res.message]);
        setReply("");
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    } catch (err: any) {
      toast(err?.message || "Failed to send reply", "error");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (ticketId) loadTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  useEffect(() => {
    // Scroll to bottom when messages load
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  if (loading) {
    return (
      <div className="u-container max-w-4xl py-8">
        <p className="text-[#9CA3AF]">Loading ticket...</p>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="u-container max-w-4xl py-8">
        <p className="text-[#9CA3AF]">Ticket not found</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="u-container max-w-4xl py-8"
    >
      <div className="mb-6">
        <Link
          href="/support/tickets"
          className="text-sm text-[#9CA3AF] hover:text-white transition"
        >
          ← Back to Tickets
        </Link>
      </div>

      {/* Ticket Header */}
      <div className="card mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold mb-2">{ticket.subject}</h1>
            <div className="flex flex-wrap gap-2 text-xs text-[#9CA3AF]">
              <span className="capitalize">
                {ticket.category.replace(/_/g, " ")}
              </span>
              <span>•</span>
              <span className={priorityColor(ticket.priority)}>
                {ticket.priority.toUpperCase()} Priority
              </span>
              <span>•</span>
              <span>Created {new Date(ticket.createdAt).toLocaleString()}</span>
              {ticket.order && (
                <>
                  <span>•</span>
                  <Link
                    href={`/orders/${ticket.order._id}`}
                    className="text-emerald-400 hover:underline"
                  >
                    Order #{ticket.order.orderNumber}
                  </Link>
                </>
              )}
            </div>
          </div>
          <span
            className={`${statusColor(ticket.status)} text-white text-xs px-3 py-1 rounded`}
          >
            {ticket.status.replace(/_/g, " ").toUpperCase()}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div
        className="card mb-4"
        style={{ maxHeight: "50vh", overflowY: "auto" }}
      >
        {messages.length === 0 ? (
          <p className="text-[#9CA3AF]">No messages yet.</p>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isUser = msg.senderType === "user";
              return (
                <div
                  key={msg._id}
                  className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      isUser
                        ? "bg-emerald-600/20 border border-emerald-500/30"
                        : "bg-[#1F2937] border border-[#374151]"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1 text-xs text-[#9CA3AF]">
                      <span className="font-medium">
                        {isUser ? "You" : "Support Team"}
                      </span>
                      <span>•</span>
                      <span>{new Date(msg.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    {msg.attachment && (
                      <a
                        href={msg.attachment}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-xs text-blue-400 hover:underline"
                      >
                        📎 View Attachment
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Reply Box */}
      {ticket.status !== "closed" ? (
        <div className="card">
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Type your reply..."
            rows={3}
            className="u-textarea w-full mb-3"
          />
          <div className="flex justify-end">
            <button
              onClick={sendReply}
              disabled={sending || !reply.trim()}
              className="btn-primary disabled:opacity-50"
            >
              {sending ? "Sending..." : "Send Reply"}
            </button>
          </div>
        </div>
      ) : (
        <div className="card bg-[#1F2937]">
          <p className="text-[#9CA3AF] text-center">
            This ticket is closed. Create a new ticket if you need further
            assistance.
          </p>
        </div>
      )}
    </motion.div>
  );
}
