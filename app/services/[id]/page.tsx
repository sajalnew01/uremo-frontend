"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function ServiceDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest(`/api/services/${id}`)
      .then(setService)
      .catch(() => alert("Service not found"))
      .finally(() => setLoading(false));
  }, [id]);

  const buyService = async () => {
    try {
      const order = await apiRequest(
        "/api/orders",
        "POST",
        { serviceId: service._id },
        true
      );
      router.push(`/payment/${order._id}`);
    } catch (e: any) {
      alert(e.message || "Login required");
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!service) return null;

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">{service.title}</h1>
      <p className="opacity-70">{service.description}</p>

      <p className="font-semibold">Price: ${service.price}</p>

      <button
        onClick={buyService}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Buy Service
      </button>
    </div>
  );
}
