"use client";

import { Fragment, useEffect, useState } from "react";
import Card from "@/components/Card";
import { apiRequest } from "@/lib/api";

interface Order {
  _id: string;
  status: string;
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

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    payment_pending: "bg-blue-600",
    payment_submitted: "bg-yellow-600",
    pending_review: "bg-yellow-600",
    processing: "bg-purple-600",
    assistance_required: "bg-orange-600",
    approved: "bg-green-600",
    completed: "bg-green-600",
    rejected: "bg-red-600",
  };
  return map[status] || "bg-gray-600";
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const load = async () => {
    const data = await apiRequest("/api/admin/orders", "GET", null, true);
    setOrders(data);
  };

  const addNote = async (id: string) => {
    if (!noteText.trim()) return;
    try {
      await apiRequest(
        `/api/admin/orders/${id}/note`,
        "POST",
        { message: noteText },
        true
      );
      setNoteText("");
      setSelectedOrderId(null);
      load();
    } catch (err) {
      alert("Failed to add note");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    await apiRequest(`/api/admin/orders/${id}`, "PUT", { status }, true);
    load();
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin — Orders</h1>

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
                      <td className="p-3">{o.userId?.email}</td>
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
                              <a
                                href={o.payment.proofUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#3B82F6] text-xs block mt-1"
                              >
                                View proof
                              </a>
                            )}
                          </>
                        ) : (
                          <span className="text-[#9CA3AF]">—</span>
                        )}
                      </td>

                      <td className="p-3">
                        <span
                          className={`px-2 py-1 rounded text-xs ${statusBadge(
                            o.status
                          )}`}
                        >
                          {o.status.replace(/_/g, " ")}
                        </span>
                      </td>

                      <td className="p-3">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() =>
                              setSelectedOrderId(
                                selectedOrderId === o._id ? null : o._id
                              )
                            }
                            className="btn-secondary px-3 py-1 text-xs"
                          >
                            {selectedOrderId === o._id ? "Hide" : "View"}
                          </button>

                          <select
                            className="px-2 py-1 text-xs rounded bg-[#020617] border border-white/10 text-white"
                            value={o.status}
                            onChange={(e) =>
                              updateStatus(o._id, e.target.value)
                            }
                          >
                            <option value="payment_pending">
                              payment pending
                            </option>
                            <option value="payment_submitted">
                              payment submitted
                            </option>
                            <option value="processing">processing</option>
                            <option value="completed">completed</option>
                            <option value="rejected">rejected</option>
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
