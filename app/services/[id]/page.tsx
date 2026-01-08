"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";
import { apiRequest } from "@/lib/api";

interface Service {
  _id: string;
  name: string;
  platform: string;
  description: string;
  shortDescription: string;
  price: number;
  serviceType: string;
  images?: string[];
}

export default function ServiceDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [buying, setBuying] = useState(false);

  const loadService = async () => {
    try {
      const data = await apiRequest(`/api/services/${params.id}`, "GET");
      setService(data);
      setSelectedImage(0);
    } catch (err) {
      console.error(err);
      alert("Failed to load service details");
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    try {
      setBuying(true);
      await apiRequest("/api/orders", "POST", { serviceId: params.id }, true);
      alert("Order created. Proceed to payment.");
      router.push("/orders");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBuying(false);
    }
  };

  useEffect(() => {
    loadService();
  }, [params.id]);

  if (loading) {
    return <div className="p-6">Loading service details...</div>;
  }

  if (!service) {
    return (
      <div className="p-6">
        <p>Service not found.</p>
        <button
          onClick={() => router.push("/buy-service")}
          className="mt-4 text-[#3B82F6] underline"
        >
          Back to Services
        </button>
      </div>
    );
  }

  const images =
    service.images && service.images.length > 0
      ? service.images
      : ["/placeholder.png"];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <button
          onClick={() => router.push("/buy-service")}
          className="text-[#3B82F6] underline text-sm mb-4"
        >
          ← Back to Services
        </button>
        <h1 className="text-3xl font-bold">{service.name}</h1>
        <p className="text-[#9CA3AF] mt-1">{service.platform}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gallery */}
        <div className="lg:col-span-2">
          <Card>
            {/* Main Image */}
            <div className="mb-4">
              <img
                src={images[selectedImage]}
                alt={`${service.name} image ${selectedImage + 1}`}
                className="w-full h-80 object-cover rounded"
              />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-16 h-16 border rounded overflow-hidden ${
                      selectedImage === idx
                        ? "border-[#3B82F6] border-2"
                        : "border-[#1F2937]"
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Description */}
          <Card title="Description" className="mt-6">
            <p className="text-sm leading-relaxed">{service.description}</p>
          </Card>

          {/* Details */}
          <Card title="Service Details" className="mt-6">
            <div className="space-y-2 text-sm">
              <p>
                <strong>Platform:</strong> {service.platform}
              </p>
              <p>
                <strong>Type:</strong> {service.serviceType.replace(/_/g, " ")}
              </p>
            </div>
          </Card>
        </div>

        {/* Sidebar - Buy Card */}
        <div>
          <Card>
            <div className="space-y-4">
              <div>
                <p className="text-[#9CA3AF] text-sm mb-2">Price</p>
                <p className="text-3xl font-bold text-[#22C55E]">
                  ${service.price}
                </p>
              </div>

              <button
                onClick={handleBuy}
                disabled={buying}
                className="w-full px-4 py-3 bg-[#3B82F6] text-white rounded font-semibold hover:bg-blue-600 disabled:opacity-50"
              >
                {buying ? "Processing..." : "Buy Service"}
              </button>

              <p className="text-xs text-[#9CA3AF]">
                All services are manually verified and delivered by UREMO.
              </p>

              <hr className="border-[#1F2937]" />

              <div className="text-xs text-[#9CA3AF]">
                <p className="mb-2">
                  <strong>Payment Info:</strong>
                </p>
                <p>
                  Payments are not automated. After placing an order, you will
                  complete payment manually and upload proof for human
                  verification.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
