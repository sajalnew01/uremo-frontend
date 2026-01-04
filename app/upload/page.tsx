"use client";

import { useState } from "react";

export default function Upload() {
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [senderKyc, setSenderKyc] = useState<File | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const token = localStorage.getItem("token");
    const orderId = localStorage.getItem("orderId");

    if (!orderId || !paymentProof || !senderKyc) {
      alert("All fields required");
      return;
    }

    const formData = new FormData();
    formData.append("orderId", orderId);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("paymentProof", paymentProof);
    formData.append("senderKyc", senderKyc);

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");

      alert("Uploaded successfully. Order under review.");
    } catch (err: any) {
      alert(err.message || "Upload error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-8 space-y-4">
      <h1 className="text-xl font-semibold">Upload Payment & KYC</h1>

      <input
        className="w-full border p-2"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        className="w-full border p-2"
        placeholder="Phone (with country code)"
        onChange={(e) => setPhone(e.target.value)}
      />

      <label>Payment Proof</label>
      <input
        type="file"
        onChange={(e) => setPaymentProof(e.target.files?.[0] || null)}
      />

      <label>Sender Government ID</label>
      <input
        type="file"
        onChange={(e) => setSenderKyc(e.target.files?.[0] || null)}
      />

      <button
        onClick={submit}
        disabled={loading}
        className="bg-black text-white px-6 py-2 rounded"
      >
        {loading ? "Uploading…" : "Submit"}
      </button>
    </div>
  );
}
export default function Page() {
  return <div className="p-8">Page works</div>;
}
