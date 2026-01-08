"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { apiRequest } from "@/lib/api";

interface PaymentMethod {
  _id: string;
  type: "paypal" | "binance" | "usdt";
  label: string;
  value: string;
  instructions?: string;
  active: boolean;
}

export default function AdminPaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);

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
        true
      );
      setMethods(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load payment methods");
    }
  };

  const createMethod = async () => {
    if (!type || !label || !value) {
      alert("Type, label, and value are required");
      return;
    }

    setLoading(true);
    try {
      await apiRequest(
        "/api/payment-methods/admin",
        "POST",
        {
          type,
          label,
          value,
          instructions,
        },
        true
      );

      setType("");
      setLabel("");
      setValue("");
      setInstructions("");
      loadMethods();
    } catch (err) {
      console.error(err);
      alert("Failed to create payment method");
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
        true
      );
      loadMethods();
    } catch (err) {
      console.error(err);
      alert("Failed to update payment method");
    }
  };

  useEffect(() => {
    loadMethods();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin — Payment Methods</h1>

      {/* Create Payment Method */}
      <Card title="Add Payment Method">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            className="p-2 border border-[#1F2937] bg-transparent rounded"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="">Select Type</option>
            <option value="paypal">PayPal</option>
            <option value="binance">Binance</option>
            <option value="usdt">USDT (Crypto)</option>
          </select>

          <input
            placeholder="Label (e.g., Main PayPal Account)"
            className="p-2 border border-[#1F2937] bg-transparent rounded"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />

          <input
            placeholder="Value (email / ID / wallet address)"
            className="p-2 border border-[#1F2937] bg-transparent rounded md:col-span-2"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />

          <textarea
            placeholder="Instructions (optional)"
            className="p-2 border border-[#1F2937] bg-transparent rounded md:col-span-2"
            rows={2}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </div>

        <button
          onClick={createMethod}
          disabled={loading}
          className="mt-4 px-4 py-2 bg-[#22C55E] text-black rounded disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add Payment Method"}
        </button>
      </Card>

      {/* Payment Methods List */}
      <Card title="Existing Payment Methods">
        {methods.length === 0 ? (
          <p className="text-sm text-[#9CA3AF]">
            No payment methods configured yet.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1F2937] text-left">
                <th className="p-2">Type</th>
                <th className="p-2">Label</th>
                <th className="p-2">Value</th>
                <th className="p-2">Status</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {methods.map((m) => (
                <tr key={m._id} className="border-b border-[#1F2937]">
                  <td className="p-2 capitalize">{m.type}</td>
                  <td className="p-2">{m.label}</td>
                  <td className="p-2 text-xs text-[#9CA3AF] truncate">
                    {m.value}
                  </td>
                  <td className="p-2">
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        m.active ? "bg-green-600" : "bg-gray-600"
                      }`}
                    >
                      {m.active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => toggleActive(m._id, m.active)}
                      className={`text-xs px-2 py-1 rounded ${
                        m.active
                          ? "bg-yellow-600 hover:bg-yellow-700"
                          : "bg-green-600 hover:bg-green-700"
                      }`}
                    >
                      {m.active ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {/* Info */}
      <Card>
        <p className="text-sm text-[#9CA3AF]">
          Payment methods you mark as active will be shown to users during
          checkout. You can instantly enable/disable any method for risk
          management.
        </p>
      </Card>
    </div>
  );
}
