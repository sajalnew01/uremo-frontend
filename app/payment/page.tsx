"use client";

import { useState } from "react";

export default function PaymentPage() {
  const [method, setMethod] = useState("");
  const [orderId, setOrderId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [tx, setTx] = useState("");

  const submit = async () => {
    if (!file || !method || !orderId) {
      return alert("All fields required");
    }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("paymentMethod", method);
    fd.append("transactionRef", tx);

    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/upload/payment-proof/${orderId}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: fd,
      }
    );

    alert("Payment submitted. Await verification.");
    window.location.href = "/orders";
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Complete Payment</h1>

      <input
        placeholder="Order ID"
        onChange={(e) => setOrderId(e.target.value)}
        className="w-full p-2 border border-zinc-800 bg-black rounded"
      />

      <select
        onChange={(e) => setMethod(e.target.value)}
        className="w-full p-2 border border-zinc-800 bg-black rounded"
      >
        <option value="">Select Payment Method</option>
        <option value="paypal">PayPal</option>
        <option value="binance">Binance</option>
        <option value="usdt">USDT (Crypto)</option>
      </select>

      {method === "paypal" && (
        <p>
          Pay to PayPal: <strong>your-paypal@email.com</strong>
        </p>
      )}

      {method === "binance" && (
        <p>
          Binance Pay ID: <strong>YOUR_BINANCE_ID</strong>
        </p>
      )}

      {method === "usdt" && (
        <p>
          USDT (TRC20) Address: <strong>YOUR_USDT_ADDRESS</strong>
        </p>
      )}

      <input
        placeholder="Transaction ID (optional)"
        onChange={(e) => setTx(e.target.value)}
        className="w-full p-2 border border-zinc-800 bg-black rounded"
      />

      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />

      <button
        className="bg-white text-black px-4 py-2 rounded"
        onClick={submit}
      >
        Submit Payment
      </button>
    </div>
  );
}
