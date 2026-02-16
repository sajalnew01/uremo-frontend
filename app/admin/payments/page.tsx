"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import Link from "next/link";

/**
 * PATCH_56: Payment Management with Tab Bar
 * Tabs: Transactions, Payment Methods, Configuration
 */

export default function AdminPaymentsPage() {
  const { toast } = useToast();
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // PATCH_56: Tab state
  const [activeTab, setActiveTab] = useState<
    "transactions" | "methods" | "config"
  >("methods");

  // form state
  const [name, setName] = useState("");
  const [type, setType] = useState("paypal");
  const [details, setDetails] = useState("");
  const [instructions, setInstructions] = useState("");

  // load payment methods
  const loadMethods = async () => {
    try {
      const data = await apiRequest("/api/admin/payments", "GET", null, true);
      setMethods(data);
    } catch (err) {
      console.error(err);
    }
  };

  // create payment method
  const createMethod = async () => {
    if (!name || !type || !details) {
      toast("Missing required fields", "error");
      return;
    }

    setLoading(true);
    try {
      await apiRequest(
        "/api/admin/payments",
        "POST",
        { name, type, details, instructions },
        true,
      );

      setName("");
      setType("paypal");
      setDetails("");
      setInstructions("");

      loadMethods();
    } catch (err) {
      toast("Failed to create payment method", "error");
    } finally {
      setLoading(false);
    }
  };

  // toggle active
  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await apiRequest(
        `/api/admin/payments/${id}`,
        "PUT",
        { active: !currentStatus },
        true,
      );
      loadMethods();
    } catch (err) {
      console.error(err);
    }
  };

  // delete method
  const deleteMethod = async (id: string) => {
    if (!confirm("Delete this payment method?")) return;
    try {
      await apiRequest(`/api/admin/payments/${id}`, "DELETE", null, true);
      loadMethods();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadMethods();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payment Management</h1>
          <p className="text-slate-400 text-sm mt-1">
            Configure payment methods and view transactions
          </p>
        </div>
      </div>

      {/* PATCH_56: Tab Bar */}
      <div className="flex items-center gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
        {[
          { key: "transactions", label: "Transactions", icon: "Txn" },
          { key: "methods", label: "Payment Methods", icon: "Method" },
          { key: "config", label: "Configuration", icon: "Config" },
        ].map((t) => {
          const active = activeTab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                active
                  ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 shadow-lg shadow-emerald-500/10"
                  : "text-slate-400 hover:bg-white/5 hover:text-white border border-transparent"
              }`}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* PATCH_56: Transactions Tab */}
      {activeTab === "transactions" && (
        <Card>
          <div className="text-center py-12">
            <span className="text-4xl block mb-3">Txn</span>
            <h3 className="text-xl font-bold text-white mb-2">
              Transaction History
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              View payment transactions in the Orders section
            </p>
            <Link
              href="/admin/orders?status=payment_submitted"
              className="text-sm px-4 py-2 bg-emerald-500/20 text-emerald-300 rounded hover:bg-emerald-500/30 inline-block"
            >
              View Payment Submissions →
            </Link>
          </div>
        </Card>
      )}

      {/* PATCH_56: Payment Methods Tab */}
      {activeTab === "methods" && (
        <>
          <Card title="Add Payment Method">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-xs tracking-widest text-slate-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  placeholder="PayPal, Binance, USDT…"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="u-input placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs tracking-widest text-slate-300 mb-2">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="u-select"
                >
                  <option value="paypal">PayPal</option>
                  <option value="crypto">Crypto</option>
                  <option value="binance">Binance</option>
                  <option value="bank">Bank</option>
                </select>
              </div>

              <div>
                <label className="block text-xs tracking-widest text-slate-300 mb-2">
                  Details
                </label>
                <input
                  type="text"
                  placeholder="Email / UID / Address…"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  className="u-input placeholder:text-slate-400"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs tracking-widest text-slate-300 mb-2">
                  Instructions (optional)
                </label>
                <textarea
                  placeholder="Send payment to this address…"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                  className="u-textarea placeholder:text-slate-400"
                />
              </div>
            </div>

            <button
              onClick={createMethod}
              disabled={loading}
              className="mt-4 btn-primary disabled:opacity-50"
            >
              {loading ? "Creating…" : "Create Payment Method"}
            </button>
          </Card>

          <Card title="Existing Methods">
            <div className="overflow-x-auto">
              <table className="min-w-[820px] w-full text-sm">
                <thead>
                  <tr className="text-left sticky top-0 bg-[#0B1220]/90 backdrop-blur border-b border-white/10">
                    <th className="p-3 text-xs tracking-widest text-slate-300">
                      Name
                    </th>
                    <th className="p-3 text-xs tracking-widest text-slate-300">
                      Type
                    </th>
                    <th className="p-3 text-xs tracking-widest text-slate-300">
                      Details
                    </th>
                    <th className="p-3 text-xs tracking-widest text-slate-300">
                      Instructions
                    </th>
                    <th className="p-3 text-xs tracking-widest text-slate-300">
                      Active
                    </th>
                    <th className="p-3 text-xs tracking-widest text-slate-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {methods.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-3 text-[#9CA3AF]">
                        No records yet.
                      </td>
                    </tr>
                  ) : (
                    methods.map((m, idx) => (
                      <tr
                        key={m._id}
                        className={`border-b border-white/10 hover:bg-white/5 transition ${
                          idx % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"
                        }`}
                      >
                        <td className="p-3 text-slate-200">{m.name}</td>
                        <td className="p-3">
                          <span className="u-pill text-slate-200 capitalize">
                            {m.type}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-xs text-slate-200 break-all">
                          {m.details}
                        </td>
                        <td className="p-3 text-sm text-slate-300">
                          {m.instructions || "—"}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => toggleActive(m._id, m.active)}
                            className={`px-3 py-1 rounded text-xs border ${
                              m.active
                                ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-200"
                                : "bg-white/5 border-white/10 text-slate-300"
                            }`}
                          >
                            {m.active ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => deleteMethod(m._id)}
                            className="text-red-200 hover:text-red-100 hover:underline text-sm"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* PATCH_56: Configuration Tab */}
      {activeTab === "config" && (
        <Card>
          <div className="text-center py-12">
            <span className="text-4xl block mb-3">Config</span>
            <h3 className="text-xl font-bold text-white mb-2">
              Payment Configuration
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Advanced payment settings coming soon
            </p>
            <div className="flex flex-col gap-2 max-w-xs mx-auto text-left">
              <div className="flex items-center gap-2 text-sm text-slate-400 bg-white/5 p-3 rounded-lg">
                <span>✓</span>
                <span>Stripe integration</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400 bg-white/5 p-3 rounded-lg">
                <span>✓</span>
                <span>PayPal integration</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400 bg-white/5 p-3 rounded-lg">
                <span>✓</span>
                <span>Crypto payments (BTC, ETH, USDT)</span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
