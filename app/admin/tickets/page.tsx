"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

interface Ticket {
  _id: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  hasUnreadAdmin: boolean;
  lastMessageAt: string;
  createdAt: string;
  user: { firstName?: string; lastName?: string; email?: string };
  order?: { orderNumber: string };
}

interface Stats {
  open: number;
  in_progress: number;
  closed: number;
  total: number;
}

const CATEGORIES = [
  { id: "", label: "All Categories" },
  { id: "payment", label: "Payment" },
  { id: "order", label: "Order" },
  { id: "kyc", label: "KYC" },
  { id: "rental", label: "Rental" },
  { id: "technical", label: "Technical" },
  { id: "affiliate", label: "Affiliate" },
  { id: "other", label: "Other" },
];

const STATUSES = [
  { id: "", label: "All Status" },
  { id: "open", label: "Open" },
  { id: "in_progress", label: "In Progress" },
  { id: "closed", label: "Closed" },
];

const PRIORITIES = [
  { id: "", label: "All Priority" },
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
];

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
      return "text-red-400 bg-red-500/20";
    case "medium":
      return "text-yellow-400 bg-yellow-500/20";
    case "low":
      return "text-green-400 bg-green-500/20";
    default:
      return "text-gray-400 bg-gray-500/20";
  }
};

export default function AdminTicketsPage() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (categoryFilter) params.set("category", categoryFilter);
      if (priorityFilter) params.set("priority", priorityFilter);
      if (search.trim()) params.set("search", search.trim());
      params.set("page", String(page));
      params.set("limit", "15");

      const data = await apiRequest<any>(
        `/api/admin/tickets?${params.toString()}`,
        "GET",
        null,
        true,
      );

      setTickets(data.tickets || []);
      setStats(data.stats || null);
      setTotalPages(data.pages || 1);
    } catch (err) {
      console.error(err);
      toast("Failed to load tickets", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, categoryFilter, priorityFilter]);

  const handleSearch = () => {
    setPage(1);
    loadTickets();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="u-container max-w-6xl py-8"
    >
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h1 className="text-2xl font-bold">Support Tickets</h1>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card text-center">
            <p className="text-2xl font-bold text-blue-400">{stats.open}</p>
            <p className="text-xs text-[#9CA3AF]">Open</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-yellow-400">
              {stats.in_progress}
            </p>
            <p className="text-xs text-[#9CA3AF]">In Progress</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold text-gray-400">{stats.closed}</p>
            <p className="text-xs text-[#9CA3AF]">Closed</p>
          </div>
          <div className="card text-center">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-xs text-[#9CA3AF]">Total</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="u-select"
          >
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="u-select"
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            className="u-select"
          >
            {PRIORITIES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search subject/user..."
            className="u-input"
          />

          <button onClick={handleSearch} className="btn-primary">
            Search
          </button>
        </div>
      </div>

      {/* Tickets Table */}
      {loading ? (
        <div className="card">
          <p className="text-[#9CA3AF]">Loading tickets...</p>
        </div>
      ) : tickets.length === 0 ? (
        <div className="card">
          <p className="text-[#9CA3AF]">No tickets found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#9CA3AF] border-b border-[#1F2937]">
                <th className="py-3 px-4">Subject</th>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Created</th>
              </tr>
            </thead>
            <tbody>
              {tickets.map((ticket) => (
                <tr
                  key={ticket._id}
                  className="border-b border-[#1F2937] hover:bg-white/5 transition cursor-pointer"
                  onClick={() =>
                    (window.location.href = `/admin/tickets/${ticket._id}`)
                  }
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {ticket.hasUnreadAdmin && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                      )}
                      <span className="font-medium truncate max-w-[200px]">
                        {ticket.subject}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-xs">
                      <p>
                        {ticket.user?.firstName} {ticket.user?.lastName}
                      </p>
                      <p className="text-[#6B7280]">{ticket.user?.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 capitalize">
                    {ticket.category.replace(/_/g, " ")}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs px-2 py-1 rounded ${priorityColor(ticket.priority)}`}
                    >
                      {ticket.priority.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-xs px-2 py-1 rounded text-white ${statusColor(ticket.status)}`}
                    >
                      {ticket.status.replace(/_/g, " ").toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#9CA3AF]">
                    {new Date(ticket.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
    </motion.div>
  );
}
