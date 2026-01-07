"use client";

import { useEffect, useState } from "react";
import Container from "@/components/Container";
import { apiRequest } from "@/lib/api";

export default function BuyService() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest("/api/services", "GET")
      .then((res) => setServices(res))
      .finally(() => setLoading(false));
  }, []);

  const buy = async (serviceId: string) => {
    try {
      await apiRequest("/api/orders", "POST", { serviceId }, true);
      alert("Order placed successfully");
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <Container>Loading...</Container>;

  return (
    <Container>
      <h1 className="text-2xl font-semibold mb-6">Buy a Service</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {services.map((service) => (
          <div
            key={service._id}
            className="border border-zinc-800 p-6 rounded-lg"
          >
            <h2 className="font-semibold mb-2">{service.name}</h2>
            <p className="text-sm text-zinc-400 mb-4">{service.description}</p>
            <p className="mb-4 font-bold">₹{service.price}</p>

            <button
              onClick={() => buy(service._id)}
              className="w-full bg-white text-black py-2 rounded"
            >
              Buy Now
            </button>
          </div>
        ))}
      </div>
    </Container>
  );
}
