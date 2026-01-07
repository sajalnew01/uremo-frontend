"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { apiRequest } from "@/lib/api";

interface Service {
  _id: string;
  name: string;
  description: string;
  price: number;
}

export default function BuyService() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const loadServices = async () => {
    try {
      const data = await apiRequest("/api/services", "GET");
      setServices(data);
    } catch {
      alert("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const buy = async (serviceId: string) => {
    try {
      await apiRequest("/api/orders", "POST", { serviceId }, true);
      alert("Order created. Proceed to payment.");
      window.location.href = "/orders";
    } catch (err: any) {
      alert(err.message);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Buy a Service</h1>
        <p className="text-[#9CA3AF]">
          All services are manually verified and delivered by UREMO.
        </p>
      </div>

      {/* Services */}
      {loading && <p>Loading services...</p>}

      {!loading && services.length === 0 && (
        <Card>
          <p className="text-sm text-[#9CA3AF]">
            No services available at the moment.
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service._id} title={service.name}>
            <p className="text-sm text-[#9CA3AF] mb-4">{service.description}</p>

            <div className="flex items-center justify-between">
              <span className="text-lg font-semibold">${service.price}</span>

              <button
                onClick={() => buy(service._id)}
                className="px-4 py-2 rounded-lg bg-[#3B82F6] text-white text-sm hover:bg-blue-500"
              >
                Buy Service
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Trust Block */}
      <Card>
        <p className="text-sm text-[#9CA3AF]">
          ⚠️ Payments are not automated. After placing an order, you will
          complete payment manually and upload proof for human verification.
        </p>
      </Card>
    </div>
  );
}
