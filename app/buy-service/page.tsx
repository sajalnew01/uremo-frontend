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

      {/* How It Works Section */}
      <div className="mb-8 p-6 border border-zinc-800 rounded-lg bg-zinc-900">
        <h2 className="text-lg font-bold mb-4">How UREMO Works</h2>
        <ol className="space-y-2 text-sm text-zinc-300">
          <li>1. Choose a service</li>
          <li>2. Place an order</li>
          <li>3. Complete payment (manual & secure)</li>
          <li>4. Upload proof</li>
          <li>5. Human verification</li>
          <li>6. Service delivered</li>
        </ol>
      </div>

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

      {/* Trust & Legal Text */}
      <div className="mt-8 p-4 text-xs text-zinc-500 border-t border-zinc-800">
        <p>
          ⚠️ UREMO is an independent service provider. We are not affiliated
          with any platform. All services are manually verified. Approval
          depends on platform rules and user history.
        </p>
      </div>
    </Container>
  );
}
