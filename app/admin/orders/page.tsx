"use client";

import { Fragment, Suspense, useEffect, useMemo, useState } from "react";
import Card from "@/components/Card";
import FilePreview from "@/components/FilePreview";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { useRouter, useSearchParams } from "next/navigation";
import { maskEmail } from "@/lib/maskEmail";
import PageHeader from "@/components/ui/PageHeader";
import { getStatusColor, getStatusLabel } from "@/lib/statusConfig";

interface Order {
  _id: string;
  status: string;
  isRejectedArchive?: boolean;
  userId?: { email: string };
  serviceId?: { title: string };
  payment?: {
    methodId?: {
      name: string;
      type: string;
      details: string;
      instructions?: string;
    };
    reference?: string;
    proofUrl?: string;
    submittedAt?: string;
  };
  timeline?: Array<{
    message: string;
    by: "system" | "admin";
    createdAt: string;
  }>;
}

// PATCH_52: Use centralized status from statusConfig
const getOrderStatusClass = (status: string) => {
  return `inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${getStatusColor(status)}`;
};

export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="p-6 text-[#9CA3AF]">Loading…</div>}>
      <AdminOrdersContent />
    </Suspense>
  );
}

function AdminOrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = useMemo(() => {
    const v = String(searchParams.get("status") || "all")
      .trim()
      .toLowerCase();
    return v || "all";
  }, [searchParams]);

  const setStatus = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!next || next === "all") params.delete("status");
    else params.set("status", next);
    const qs = params.toString();
    router.push(qs ? `/admin/orders?${qs}` : "/admin/orders");
  };

  const load = async (statusValue: string) => {
    const qs =
      statusValue && statusValue !== "all"
        ? `?status=${encodeURIComponent(statusValue)}`
        : "";
    const data = await apiRequest(`/api/admin/orders${qs}`, "GET", null, true);
    setOrders(data);
  };

  const addNote = async (id: string) => {
    if (!noteText.trim()) return;
    try {
      await apiRequest(
        `/api/admin/orders/${id}/note`,
        "POST",
        { message: noteText },
        true,
      );
      setNoteText("");
      setSelectedOrderId(null);
      load(status);
    } catch (err) {
      toast("Failed to add note", "error");
    }
  };

  const updateStatus = async (id: string, nextStatus: string) => {
    try {
      await apiRequest(
        `/api/admin/orders/${id}`,
        "PUT",
        { status: nextStatus },
        true,
      );
      toast("Order updated", "success");
      load(status);
    } catch (err: any) {
      toast(err?.message || "Failed to update status", "error");
    }
  };

  const verifyPayment = async (id: string) => {
    try {
      await apiRequest(
        `/api/admin/orders/${id}/verify-payment`,
        "PUT",
        {},
        true,
      );

      toast("Payment verified. Order moved to in progress.", "success");
      load(status);
    } catch (err: any) {
      toast(err?.message || "Failed to verify payment", "error");
    }
  };

  const archiveCancelled = async (id: string) => {
    try {
      await apiRequest(
        `/api/admin/orders/${id}/archive-cancelled`,
        "PUT",
        {},
        true,
      );
      load(status);
    } catch (err) {
      toast("Failed to move order to cancelled list", "error");
    }
  };

  useEffect(() => {
    load(status);
  }, [status]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Review payments and update order status"
      />

      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "All" },
          { key: "payment_submitted", label: "⚠️ Payment Submitted" },
          { key: "pending", label: "Pending" },
          { key: "in_progress", label: "In Progress" },
          { key: "waiting_user", label: "Waiting on User" },
          { key: "completed", label: "Completed" },
          { key: "cancelled", label: "Cancelled" },
        ].map((t) => {
          const active = status === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setStatus(t.key)}
              className={`px-4 py-2 rounded-xl text-sm border transition ${
                active
                  ? "bg-white/10 border-white/20 text-white"
                  : "bg-white/5 border-white/10 text-zinc-200 hover:bg-white/10"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left sticky top-0 bg-[#0B1220]/90 backdrop-blur border-b border-white/10">
                <th className="p-3 text-xs tracking-widest text-[#9CA3AF]">
                  User
                </th>
                <th className="p-3 text-xs tracking-widest text-[#9CA3AF]">
                  Service
                </th>
                <th className="p-3 text-xs tracking-widest text-[#9CA3AF]">
                  Payment
                </th>
                <th className="p-3 text-xs tracking-widest text-[#9CA3AF]">
                  Status
                </th>
                <th className="p-3 text-xs tracking-widest text-[#9CA3AF]">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-3 text-[#9CA3AF]">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((o, rowIdx) => (
                  <Fragment key={o._id}>
                    <tr
                      className={`border-b border-white/10 hover:bg-white/5 transition ${
                        rowIdx % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"
                      }`}
                    >
                      <td className="p-3">
                        <div className="group relative inline-flex items-center gap-2">
                          <span className="text-sm">
                            {maskEmail(o.userId?.email)}
                          </span>
                          {o.userId?.email && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(o.userId!.email);
                                toast("Email copied", "success");
                              }}
                              className="opacity-0 group-hover:opacity-100 transition text-xs text-slate-400 hover:text-white px-2 py-1 rounded border border-white/10 bg-white/5"
                              title={o.userId.email}
                            >
                              Copy
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-3">{o.serviceId?.title}</td>

                      <td className="p-3 space-y-1">
                        {o.payment?.methodId ? (
                          <>
                            <div className="font-semibold text-sm">
                              {o.payment.methodId.name}
                            </div>
                            <div className="text-xs text-[#9CA3AF]">
                              {o.payment.methodId.type}
                            </div>
                            <div className="text-xs font-mono bg-[#111827] p-1 rounded mt-1 break-all">
                              {o.payment.methodId.details}
                            </div>
                            {o.payment.methodId.instructions && (
                              <div className="text-xs text-[#9CA3AF] mt-1">
                                {o.payment.methodId.instructions}
                              </div>
                            )}
                            {o.payment.reference && (
                              <div className="text-xs text-[#9CA3AF] mt-1">
                                Ref: {o.payment.reference}
                              </div>
                            )}
                            {o.payment.proofUrl && (
                              <div className="mt-2">
                                <FilePreview
                                  url={o.payment.proofUrl}
                                  label="View proof"
                                />
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-[#9CA3AF]">—</span>
                        )}
                      </td>

                      <td className="p-3">
                        <span className={getOrderStatusClass(o.status)}>
                          {getStatusLabel(o.status)}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() =>
                              setSelectedOrderId(
                                selectedOrderId === o._id ? null : o._id,
                              )
                            }
                            className="btn-secondary px-3 py-1 text-xs"
                          >
                            {selectedOrderId === o._id ? "Hide" : "View"}
                          </button>

                          {o.status === "cancelled" && !o.isRejectedArchive && (
                            <button
                              type="button"
                              onClick={() => archiveCancelled(o._id)}
                              className="px-3 py-1 text-xs rounded bg-red-600/20 border border-red-500/30 text-red-200 hover:bg-red-600/30"
                            >
                              Move to Cancelled Archive
                            </button>
                          )}

                          {o.status === "waiting_user" && (
                            <button
                              type="button"
                              onClick={() => verifyPayment(o._id)}
                              className="px-3 py-1 text-xs rounded bg-emerald-600/20 border border-emerald-500/30 text-emerald-200 hover:bg-emerald-600/30"
                            >
                              Verify Payment
                            </button>
                          )}

                          <select
                            className="px-2 py-1 text-xs rounded bg-[#020617] border border-white/10 text-white"
                            value={o.status}
                            onChange={(e) =>
                              updateStatus(o._id, e.target.value)
                            }
                          >
                            <option value="pending">pending</option>
                            <option value="in_progress">in progress</option>
                            <option value="waiting_user">
                              waiting on user
                            </option>
                            <option value="completed">completed</option>
                            <option value="cancelled">cancelled</option>
                          </select>
                        </div>
                      </td>
                    </tr>

                    {selectedOrderId === o._id && (
                      <tr className="border-b border-white/10">
                        <td colSpan={5} className="p-4">
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-semibold mb-2">Timeline</h4>
                              <div className="space-y-2 text-xs">
                                {o.timeline && o.timeline.length > 0 ? (
                                  o.timeline.map((t, idx) => (
                                    <div
                                      key={idx}
                                      className="pl-2 border-l border-[#1F2937]"
                                    >
                                      <span className="text-[#9CA3AF]">
                                        {new Date(t.createdAt).toLocaleString()}
                                      </span>
                                      {" — "}
                                      {t.message}
                                      {t.by === "admin" && (
                                        <span className="ml-2 text-[#9CA3AF]">
                                          (Admin)
                                        </span>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-[#9CA3AF]">
                                    No timeline events yet.
                                  </p>
                                )}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-semibold mb-2">Add Note</h4>
                              <textarea
                                placeholder="Type a note..."
                                value={noteText}
                                onChange={(e) => setNoteText(e.target.value)}
                                className="u-textarea text-sm"
                                rows={2}
                              />
                              <button
                                onClick={() => addNote(o._id)}
                                className="mt-2 btn-primary px-3 py-1 text-xs"
                              >
                                Add Note
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
