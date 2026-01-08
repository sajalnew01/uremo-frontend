"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";
import { apiRequest } from "@/lib/api";

interface Service {
  _id: string;
  name: string;
  description: string;
  price: number;
  shortDescription?: string;
  images?: string[];
}

export default function BuyService() {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const loadServices = async () => {
    try {
      const data = await apiRequest("/api/services", "GET");
      setServices(data);
    } catch (err: any) {
      alert(err.message || "Failed to load services");
    } finally {
      setLoading(false);
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
        {services.map((s: Service) => (
          <div
            key={s._id}
            className="border border-[#1F2937] rounded-lg overflow-hidden bg-[#020617]"
          >
            {/* Image */}
            <div className="h-40 bg-black">
              <img
                src={s.images?.[0] || "/placeholder.png"}
                alt={s.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Content */}
            <div className="p-4 space-y-2">
              <h3 className="font-semibold text-lg">{s.name}</h3>

              <p className="text-sm text-[#9CA3AF]">{s.shortDescription}</p>

              <div className="flex justify-between items-center pt-2">
                <span className="font-bold text-[#22C55E]">${s.price}</span>

                <button
                  onClick={() => buyService(s._id)}
                  className="px-3 py-1 bg-[#3B82F6] rounded text-sm"
                >
                  Buy
                </button>
              </div>
            </div>
          </div>
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
