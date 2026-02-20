"use client";

import { useState } from "react";
import Card from "@/components/Card";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

export default function PaymentPage() {
  const { toast } = useToast();
  const [orderId, setOrderId] = useState("");
  const [method, setMethod] = useState("");
  const [tx, setTx] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!orderId || !method || !file) {
      toast("Order ID, payment method, and proof are required", "error");
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
        true,
      );
      toast("Payment submitted. Manual verification in progress.", "success");
      window.location.href = "/orders";
    } catch (err: any) {
      toast(err.message || "Submission failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Complete Payment</h1>
        <p className="text-[#9CA3AF]">
          All payments are manually verified by the UREMO team.
        </p>
      </div>

      {/* Order ID */}
      <Card title="Order Information">
        <input
          placeholder="Enter your Order ID"
          className="w-full p-2 bg-transparent border border-[#1F2937] rounded"
          onChange={(e) => setOrderId(e.target.value)}
        />
      </Card>

      {/* Payment Methods */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="PayPal">
          <p className="text-sm text-[#9CA3AF] mb-3">Send payment to:</p>
          <p className="font-semibold mb-4">payments@uremo.online</p>
          <button
            onClick={() => setMethod("paypal")}
            className={`w-full py-2 rounded ${
              method === "paypal" ? "bg-[#3B82F6]" : "border border-[#1F2937]"
            }`}
          >
            Select PayPal
          </button>
        </Card>

        <Card title="Binance">
          <p className="text-sm text-[#9CA3AF] mb-3">Binance Pay ID:</p>
          <p className="font-semibold mb-4">
            {process.env.NEXT_PUBLIC_BINANCE_PAY_ID ||
              "Contact support for Binance Pay ID"}
          </p>
          <button
            onClick={() => setMethod("binance")}
            className={`w-full py-2 rounded ${
              method === "binance" ? "bg-[#3B82F6]" : "border border-[#1F2937]"
            }`}
          >
            Select Binance
          </button>
        </Card>

        <Card title="USDT (Crypto)">
          <p className="text-sm text-[#9CA3AF] mb-3">Network: TRC20</p>
          <p className="font-semibold mb-4 break-all">
            {process.env.NEXT_PUBLIC_USDT_WALLET ||
              "Contact support for USDT wallet address"}
          </p>
          <button
            onClick={() => setMethod("usdt")}
            className={`w-full py-2 rounded ${
              method === "usdt" ? "bg-[#3B82F6]" : "border border-[#1F2937]"
            }`}
          >
            Select USDT
          </button>
        </Card>
      </div>

      {/* Proof Upload */}
      <Card title="Upload Payment Proof">
        <input
          type="file"
          className="mb-3"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />

        <input
          placeholder="Transaction ID / Reference (optional)"
          className="w-full p-2 bg-transparent border border-[#1F2937] rounded mb-4"
          onChange={(e) => setTx(e.target.value)}
        />

        <button
          onClick={submit}
          disabled={loading}
          className="px-4 py-2 rounded bg-[#22C55E] text-black"
        >
          {loading ? "Submitting..." : "Submit for Verification"}
        </button>
      </Card>

      {/* Legal / Trust */}
      <Card>
        <p className="text-xs text-[#9CA3AF]">
          UREMO is an independent service provider. Payments are reviewed
          manually. We are not affiliated with any third-party platform.
        </p>
      </Card>
    </div>
  );
}
