"use client";

import Link from "next/link";

export default function AdminDashboard() {

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
      <p className="text-slate-400 mb-8">
        Manage services, payments, orders, and applications.
      </p>

      <div className="grid md:grid-cols-4 gap-6">
        <Link href="/admin/services">
          <div className="card cursor-pointer hover:border-white/20 transition">
            <h3 className="font-semibold">Services</h3>
            <p className="text-sm text-slate-400 mt-2">
              Add & manage marketplace services
            </p>
          </div>
        </Link>

        <Link href="/admin/orders">
          <div className="card cursor-pointer hover:border-white/20 transition">
            <h3 className="font-semibold">Orders</h3>
            <p className="text-sm text-slate-400 mt-2">
              Review payments & update status
            </p>
          </div>
        </Link>

        <Link href="/admin/payment-methods">
          <div className="card cursor-pointer hover:border-white/20 transition">
            <h3 className="font-semibold">Payment Methods</h3>
            <p className="text-sm text-slate-400 mt-2">
              Control PayPal / Crypto details
            </p>
          </div>
        </Link>

        <Link href="/admin/applications">
          <div className="card cursor-pointer hover:border-white/20 transition">
            <h3 className="font-semibold">Applications</h3>
            <p className="text-sm text-slate-400 mt-2">
              Review work applications
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}

  const update = async (id: string, status: string) => {
    await apiRequest(`/api/admin/orders/${id}`, "PUT", { status }, true);
    load();
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
      setSelectedOrder(null);
      load();
    } catch (err) {
      alert("Failed to add note");
    }
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
              <tr className="border-b border-[#1F2937] text-left">
                <th className="p-3">User</th>
                <th className="p-3">Service</th>
                <th className="p-3">Payment</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((o) => (
                <div key={o._id}>
                  <tr className="border-b border-[#1F2937]">
                    <td className="p-3">{o.user?.email}</td>
                    <td className="p-3">{o.serviceId?.title}</td>

                    <td className="p-3 space-y-1">
                      {o.payment?.methodId ? (
                        <>
                          <div className="font-semibold text-sm">
                            {o.payment.methodId.label}
                          </div>
                          <div className="text-xs text-[#9CA3AF]">
                            {o.payment.methodId.type}
                          </div>
                          <div className="text-xs font-mono bg-[#111827] p-1 rounded mt-1 break-all">
                            {o.payment.methodId.value}
                          </div>
                          {o.payment.reference && (
                            <div className="text-xs text-[#9CA3AF] mt-1">
                              Ref: {o.payment.reference}
                            </div>
                          )}
                          {o.payment.proofUrl && (
                            <a
                              href={o.payment.proofUrl}
                              target="_blank"
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
                      <button
                        onClick={() =>
                          setSelectedOrder(
                            selectedOrder === o._id ? null : o._id
                          )
                        }
                        className="px-3 py-1 bg-blue-600 rounded text-xs"
                      >
                        {selectedOrder === o._id ? "Hide" : "View"}
                      </button>
                    </td>
                  </tr>

                  {selectedOrder === o._id && (
                    <tr className="border-b border-[#1F2937]">
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
                                        (🔒 Admin)
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
                              className="w-full p-2 border border-[#1F2937] rounded bg-[#020617] text-white text-sm"
                              rows={2}
                            />
                            <button
                              onClick={() => addNote(o._id)}
                              className="mt-2 px-3 py-1 bg-green-600 rounded text-xs"
                            >
                              Add Note
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </div>
              ))}
            </tbody>
          </table>

          {orders.length === 0 && (
            <p className="text-sm text-[#9CA3AF] mt-4">No orders found.</p>
          )}
        </div>
      </Card>
    </div>
  );
}
