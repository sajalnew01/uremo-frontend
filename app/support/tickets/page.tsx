"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { EmojiTickets } from "@/components/ui/Emoji";
import { getStatusColor, getStatusLabel } from "@/lib/statusConfig";

interface Ticket {
  _id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  hasUnreadUser: boolean;
  lastMessageAt: string;
  createdAt: string;
  order?: { orderNumber: string; status: string };
}

const CATEGORIES = [
  { id: "general", label: "General Inquiry" },
  { id: "payment", label: "Payment Issue" },
  { id: "order", label: "Order Problem" },
  { id: "kyc", label: "KYC / Verification" },
  { id: "rental", label: "Rental Service" },
  { id: "technical", label: "Technical Issue" },
  { id: "affiliate", label: "Affiliate Program" },
  { id: "other", label: "Other" },
];

const PRIORITIES = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
];

// PATCH_52: Use centralized status from statusConfig
const getTicketStatusClass = (status: string) => {
  return `inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getStatusColor(status)}`;
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

export default function SupportTicketsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Create ticket modal
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: "",
    category: "other",
    priority: "medium",
    message: "",
    orderId: "",
  });
  const [userOrders, setUserOrders] = useState<
    Array<{ _id: string; orderNumber: string; status: string }>
  >([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // File upload state for ticket creation
  const [attachments, setAttachments] = useState<
    Array<{
      url: string;
      filename: string;
      fileType: string;
      publicId: string;
      size: number;
    }>
  >([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
      "application/zip",
      "application/x-zip-compressed",
      "text/plain",
    ];

    const validFiles = Array.from(files).filter((file) => {
      if (!allowedTypes.includes(file.type)) {
        toast(
          `${file.name} is not allowed. Only images, PDF, ZIP, and TXT.`,
          "error",
        );
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast(`${file.name} is too large. Max 10MB.`, "error");
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setUploading(true);
    try {
      for (const file of validFiles) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await apiRequest<any>(
          "/api/upload/chat",
          "POST",
          formData,
          true,
          true, // isFormData
        );

        if (uploadRes.url) {
          setAttachments((prev) => [
            ...prev,
            {
              url: uploadRes.url,
              filename: uploadRes.filename,
              fileType: uploadRes.fileType,
              publicId: uploadRes.publicId,
              size: uploadRes.size,
            },
          ]);
        }
      }
    } catch (err: any) {
      toast(err?.message || "Failed to upload files", "error");
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const loadTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", "10");

      const data = await apiRequest<any>(
        `/api/tickets?${params.toString()}`,
        "GET",
        null,
        true,
      );

      setTickets(data.tickets || []);
      setTotalPages(data.pages || 1);
    } catch (err) {
      console.error(err);
      toast("Failed to load tickets", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await apiRequest<any>(
        "/api/tickets/orders",
        "GET",
        null,
        true,
      );
      if (res.ok) {
        setUserOrders(res.orders || []);
      }
    } catch (err) {
      console.error("Failed to load orders:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const createTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      toast("Subject and message are required", "error");
      return;
    }

    setCreating(true);
    try {
      const payload: any = {
        subject: newTicket.subject,
        category: newTicket.category,
        priority: newTicket.priority,
        message: newTicket.message,
      };
      if (newTicket.orderId) {
        payload.orderId = newTicket.orderId;
      }
      if (attachments.length > 0) {
        payload.attachments = attachments;
      }

      const res = await apiRequest<any>("/api/tickets", "POST", payload, true);

      if (res.ok && res.ticket) {
        toast("Ticket created successfully", "success");
        setShowCreate(false);
        setNewTicket({
          subject: "",
          category: "other",
          priority: "medium",
          message: "",
          orderId: "",
        });
        setAttachments([]); // Clear attachments
        router.push(`/support/tickets/${res.ticket._id}`);
      }
    } catch (err: any) {
      toast(err?.message || "Failed to create ticket", "error");
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter]);

  // Load orders when create modal opens
  useEffect(() => {
    if (showCreate) {
      loadOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCreate]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="u-container max-w-4xl py-8"
    >
      <PageHeader
        title="My Support Tickets"
        emoji={<EmojiTickets />}
        description="View and manage your support requests"
        actionLabel="+ New Ticket"
        actionOnClick={() => setShowCreate(true)}
      />

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="u-select"
        >
          <option value="">All Status</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="card">
          <p className="text-[#9CA3AF]">Loading tickets...</p>
        </div>
      ) : tickets.length === 0 ? (
        <EmptyState
          icon="Ticket"
          title="No support tickets yet"
          description="Have a question or need help? Create a support ticket and our team will assist you."
          ctaText="Create Ticket"
          ctaHref="#"
          secondaryCtaText="Browse FAQs"
          secondaryCtaHref="/support"
        />
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <Link
              key={ticket._id}
              href={`/support/tickets/${ticket._id}`}
              className="block card hover:bg-white/5 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {ticket.hasUnreadUser && (
                      <span className="w-2 h-2 bg-blue-500 rounded-full" />
                    )}
                    <h3 className="font-semibold truncate">{ticket.subject}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs text-[#9CA3AF]">
                    <span className="capitalize">
                      {ticket.category.replace(/_/g, " ")}
                    </span>
                    <span>•</span>
                    <span className={priorityColor(ticket.priority)}>
                      {ticket.priority.toUpperCase()}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </span>
                    {ticket.order && (
                      <>
                        <span>•</span>
                        <span>Order #{ticket.order.orderNumber}</span>
                      </>
                    )}
                  </div>
                </div>
                <span className={getTicketStatusClass(ticket.status)}>
                  {getStatusLabel(ticket.status)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 text-sm bg-[#1F2937] rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-[#9CA3AF]">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 text-sm bg-[#1F2937] rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showCreate && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCreate(false);
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#0F172A] border border-[#1F2937] rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
          >
            <h2 className="text-xl font-bold mb-4">Create Support Ticket</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-[#9CA3AF] mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, subject: e.target.value })
                  }
                  placeholder="Brief description of your issue"
                  className="u-input w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1">
                    Category
                  </label>
                  <select
                    value={newTicket.category}
                    onChange={(e) =>
                      setNewTicket({ ...newTicket, category: e.target.value })
                    }
                    className="u-select w-full"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1">
                    Priority
                  </label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) =>
                      setNewTicket({ ...newTicket, priority: e.target.value })
                    }
                    className="u-select w-full"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                {/* Related Order Dropdown */}
                <div>
                  <label className="block text-sm text-[#9CA3AF] mb-1">
                    Related Order (optional)
                  </label>
                  <select
                    value={newTicket.orderId}
                    onChange={(e) =>
                      setNewTicket({ ...newTicket, orderId: e.target.value })
                    }
                    className="u-select w-full"
                    disabled={loadingOrders}
                  >
                    <option value="">
                      {loadingOrders ? "Loading orders..." : "-- No Order --"}
                    </option>
                    {userOrders.map((order) => (
                      <option key={order._id} value={order._id}>
                        Order #{order.orderNumber} (
                        {order.status.replace(/_/g, " ")})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-[#6B7280] mt-1">
                    Link this ticket to an existing order if relevant
                  </p>
                </div>

                <label className="block text-sm text-[#9CA3AF] mb-1">
                  Message *
                </label>
                <textarea
                  value={newTicket.message}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, message: e.target.value })
                  }
                  placeholder="Describe your issue in detail..."
                  rows={5}
                  className="u-textarea w-full"
                />
              </div>

              {/* File Attachments Section */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {attachments.map((att, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 bg-[#1F2937] border border-[#374151] rounded px-3 py-1 text-xs"
                    >
                      <span className="text-[#9CA3AF]">
                        Attachment: {att.filename}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="text-red-400 hover:text-red-300 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-3 justify-between items-center pt-4">
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*,application/pdf,application/zip,text/plain"
                    multiple
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="btn-secondary text-sm disabled:opacity-50"
                  >
                    {uploading ? "Uploading..." : "Attach Files"}
                  </button>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowCreate(false);
                      setAttachments([]); // Clear attachments on cancel
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createTicket}
                    disabled={creating || uploading}
                    className="btn-primary disabled:opacity-50"
                  >
                    {creating ? "Creating..." : "Create Ticket"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
