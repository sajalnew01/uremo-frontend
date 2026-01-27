"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

interface PaymentMethod {
  _id: string;
  type: "paypal" | "binance" | "usdt" | "bank" | "other";
  label: string;
  value: string;
  instructions?: string;
  active: boolean;
}

export default function AdminPaymentMethodsPage() {
  const { toast } = useToast();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState("");
  const [label, setLabel] = useState("");
  const [value, setValue] = useState("");
  const [instructions, setInstructions] = useState("");

  const loadMethods = async () => {
    try {
      const data = await apiRequest(
        "/api/payment-methods/admin",
        "GET",
        null,
        true,
      );
      setMethods(data);
    } catch (err) {
      console.error(err);
      toast("Failed to load payment methods", "error");
    }
  };

  const resetForm = () => {
    setType("");
    setLabel("");
    setValue("");
    setInstructions("");
    setIsEditing(false);
    setEditingId(null);
  };

  const startEdit = (m: PaymentMethod) => {
    setType(m.type);
    setLabel(m.label);
    setValue(m.value);
    setInstructions(m.instructions || "");
    setEditingId(m._id);
    setIsEditing(true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveMethod = async () => {
    if (!type || !label || !value) {
      toast("Type, label, and value are required", "error");
      return;
    }

    setLoading(true);
    try {
      if (isEditing && editingId) {
        await apiRequest(
          `/api/payment-methods/admin/${editingId}`,
          "PUT",
          { type, label, value, instructions },
          true,
        );
        toast("Payment method updated", "success");
      } else {
        await apiRequest(
          "/api/payment-methods/admin",
          "POST",
          { type, label, value, instructions },
          true,
        );
        toast("Payment method created", "success");
      }
      resetForm();
      loadMethods();
    } catch (err) {
      console.error(err);
      toast("Failed to save payment method", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      await apiRequest(
        `/api/payment-methods/admin/${id}`,
        "PUT",
        { active: !active },
        true,
      );
      loadMethods();
      toast(active ? "Method disabled" : "Method enabled", "success");
    } catch (err) {
      console.error(err);
      toast("Failed to update payment method", "error");
    }
  };

  useEffect(() => {
    loadMethods();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin — Payment Methods</h1>
        {isEditing && (
          <button
            onClick={resetForm}
            className="text-sm text-slate-400 hover:text-white"
          >
            ← Cancel Editing
          </button>
        )}
      </div>

      {/* Create/Edit Payment Method */}
      <Card
        title={isEditing ? "✏️ Edit Payment Method" : "➕ Add Payment Method"}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            className="u-select"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">Select Type</option>
            <option value="paypal">PayPal</option>
            <option value="binance">Binance</option>
            <option value="usdt">USDT (Crypto)</option>
            <option value="bank">Bank Transfer</option>
            <option value="other">Other</option>
          </select>

          <input
            placeholder="Label (e.g., Main PayPal Account)"
            className="u-input placeholder:text-slate-400"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />

          <input
            placeholder="Value (email / ID / wallet address)"
            className="u-input placeholder:text-slate-400 md:col-span-2"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />

          <textarea
            placeholder="Instructions for users (optional)"
            className="u-textarea placeholder:text-slate-400 md:col-span-2"
            rows={3}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={saveMethod}
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading
              ? "Saving..."
              : isEditing
                ? "💾 Update Method"
                : "➕ Add Payment Method"}
          </button>
          {isEditing && (
            <button onClick={resetForm} className="btn-secondary">
              Cancel
            </button>
          )}
        </div>
      </Card>

      {/* Payment Methods List */}
      <Card title="📋 Existing Payment Methods">
        {methods.length === 0 ? (
          <p className="text-sm text-[#9CA3AF]">
            No payment methods configured yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[700px] w-full text-sm">
              <thead>
                <tr className="border-b border-[#1F2937] text-left">
                  <th className="p-3 text-xs text-slate-400 uppercase">Type</th>
                  <th className="p-3 text-xs text-slate-400 uppercase">
                    Label
                  </th>
                  <th className="p-3 text-xs text-slate-400 uppercase">
                    Value
                  </th>
                  <th className="p-3 text-xs text-slate-400 uppercase">
                    Status
                  </th>
                  <th className="p-3 text-xs text-slate-400 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {methods.map((m) => (
                  <tr
                    key={m._id}
                    className="border-b border-[#1F2937] hover:bg-white/5"
                  >
                    <td className="p-3">
                      <span className="px-2 py-1 rounded bg-slate-700 text-xs uppercase">
                        {m.type}
                      </span>
                    </td>
                    <td className="p-3 font-medium">{m.label}</td>
                    <td className="p-3">
                      <div className="text-sm truncate max-w-[180px]">
                        {m.value}
                      </div>
                      {m.instructions && (
                        <div className="text-xs text-slate-500 truncate max-w-[180px]">
                          {m.instructions}
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-xs px-2 py-1 rounded font-medium ${
                          m.active
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-slate-600/50 text-slate-400"
                        }`}
                      >
                        {m.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEdit(m)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => toggleActive(m._id, m.active)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                            m.active
                              ? "bg-yellow-600/20 text-yellow-300 border border-yellow-500/30"
                              : "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30"
                          }`}
                        >
                          {m.active ? "Disable" : "Enable"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Info */}
      <Card>
        <div className="flex items-start gap-3">
          <span className="text-xl">💡</span>
          <p className="text-sm text-[#9CA3AF]">
            Payment methods marked as active will be shown to users during
            checkout. Click "Edit" to modify any method&apos;s details. Use
            "Disable" to temporarily hide a method.
          </p>
        </div>
      </Card>
    </div>
  );
}
