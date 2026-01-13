"use client";

import { useState } from "react";
import Container from "@/components/Container";
import { useToast } from "@/hooks/useToast";

export default function Upload() {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!file || !orderId) {
      toast("Missing info", "error");
      return;
    }

    const form = new FormData();
    form.append("file", file);

    const token = localStorage.getItem("token");

    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/upload/payment-proof/${orderId}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: form,
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");

      toast("Uploaded successfully", "success");
      setFile(null);
      setOrderId("");
    } catch (err: any) {
      toast(err.message || "Upload failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <div className="max-w-md mx-auto mt-10 space-y-4">
        <h1 className="text-xl font-semibold">Upload Payment Proof</h1>

        <input
          placeholder="Order ID"
          className="w-full p-2 bg-black border border-zinc-800 rounded"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
        />

        <div>
          <label className="block text-sm mb-2">Payment Screenshot</label>
          <input
            type="file"
            accept="image/*"
            className="w-full"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-white text-black py-2 rounded disabled:opacity-50"
        >
          {loading ? "Uploading..." : "Submit"}
        </button>
      </div>
    </Container>
  );
}
