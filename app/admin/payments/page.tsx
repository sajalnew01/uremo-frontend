"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

export default function AdminPaymentsPage() {
  const [methods, setMethods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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
      alert("Missing required fields");
      return;
    }

    setLoading(true);
    try {
      await apiRequest(
        "/api/admin/payments",
        "POST",
        { name, type, details, instructions },
        true
      );

      setName("");
      setType("paypal");
      setDetails("");
      setInstructions("");

      loadMethods();
    } catch (err) {
      alert("Failed to create payment method");
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
        true
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
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Admin - Payment Methods</h1>

      {/* Create Form */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Add Payment Method</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            type="text"
            placeholder="PayPal, Binance, USDT..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="paypal">PayPal</option>
            <option value="crypto">Crypto</option>
            <option value="binance">Binance</option>
            <option value="bank">Bank</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Details</label>
          <input
            type="text"
            placeholder="Email / UID / Address..."
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">
            Instructions (optional)
          </label>
          <textarea
            placeholder="Send payment to this address..."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={3}
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <button
          onClick={createMethod}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Payment Method"}
        </button>
      </div>

      {/* List */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Existing Methods</h2>
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Details</th>
              <th className="text-left p-3">Instructions</th>
              <th className="text-left p-3">Active</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {methods.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-3 text-gray-500">
                  No records yet.
                </td>
              </tr>
            ) : (
              methods.map((m) => (
                <tr key={m._id} className="border-b">
                  <td className="p-3">{m.name}</td>
                  <td className="p-3">
                    <span className="bg-gray-200 px-2 py-1 rounded text-xs">
                      {m.type}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-sm">{m.details}</td>
                  <td className="p-3 text-sm text-gray-600">
                    {m.instructions || "-"}
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => toggleActive(m._id, m.active)}
                      className={`px-3 py-1 rounded text-xs ${
                        m.active
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {m.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => deleteMethod(m._id)}
                      className="text-red-600 hover:underline text-sm"
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
    </div>
  );
}
