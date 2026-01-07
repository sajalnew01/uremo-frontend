"use client";

import Container from "@/components/Container";
import { useState } from "react";
import { apiRequest } from "@/lib/api";

export default function PaymentPage() {
  const [method, setMethod] = useState("");
  const [orderId, setOrderId] = useState("");
  const [tx, setTx] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!orderId || !method || !file) {
      alert("All fields are required");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("paymentMethod", method);
    fd.append("transactionRef", tx);

    try {
      setLoading(true);
      await apiRequest(
        `/api/upload/payment-proof/${orderId}`,
        "POST",
        fd,
        true,
        true
      );
      alert("Payment submitted. Verification in progress.");
      window.location.href = "/orders";
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <h1 className="text-2xl font-bold mb-2">Complete Payment</h1>

      <p className="text-sm text-gray-400 mb-6">
        ⚠️ All payments are manually verified by UREMO staff for security.
      </p>

      <input
        placeholder="Order ID"
        className="w-full p-2 mb-4 border"
        onChange={(e) => setOrderId(e.target.value)}
      />

      <select
        className="w-full p-2 mb-4 border"
        onChange={(e) => setMethod(e.target.value)}
      >
        <option value="">Select payment method</option>
        <option value="paypal">PayPal</option>
        <option value="binance">Binance</option>
        <option value="usdt">USDT (Crypto)</option>
      </select>

      {method === "paypal" && (
        <div className="mb-4 p-3 border rounded">
          <b>PayPal Email</b>
          <p>payments@uremo.online</p>
        </div>
      )}

      {method === "binance" && (
        <div className="mb-4 p-3 border rounded">
          <b>Binance Pay ID</b>
          <p>UREMO_BINANCE_ID</p>
        </div>
      )}

      {method === "usdt" && (
        <div className="mb-4 p-3 border rounded">
          <b>USDT (TRC20)</b>
          <p>YOUR_USDT_WALLET_ADDRESS</p>
        </div>
      )}

      <input
        placeholder="Transaction ID / Reference (optional)"
        className="w-full p-2 mb-4 border"
        onChange={(e) => setTx(e.target.value)}
      />

      <input
        type="file"
        className="mb-4"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button onClick={submit} disabled={loading} className="px-4 py-2 border">
        {loading ? "Submitting..." : "Submit Payment"}
      </button>

      <p className="text-xs text-gray-500 mt-6">
        UREMO is an independent service provider. We are not affiliated with any
        platform. Approval depends on verification and platform rules.
      </p>
    </Container>
  );
}
