"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function BuyService() {
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest("/api/services", "GET", null, true)
      .then(setServices)
      .finally(() => setLoading(false));
  }, []);

  const buy = async (serviceId: string) => {
    try {
      const res = await apiRequest(
        "/api/payment/checkout",
        "POST",
        { serviceId },
        true
      );

      if (res.url) {
        window.location.href = res.url;
      } else {
        alert("Payment initiation failed");
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <p className="p-8">Loading services…</p>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Buy a Service</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {services.map((s) => (
          <div key={s._id} className="border rounded p-4">
            <h2 className="font-medium text-lg">{s.name}</h2>
            <p className="text-sm text-gray-600">{s.description}</p>
            <p className="mt-2 font-semibold">${s.price}</p>

            <button
              onClick={() => buy(s._id)}
              className="mt-4 bg-black text-white px-4 py-2 rounded"
            >
              Continue
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
