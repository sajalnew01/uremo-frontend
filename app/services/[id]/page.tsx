"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";

export default function ServiceDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [service, setService] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadService = async () => {
    try {
      const data = await apiRequest(`/api/services/${id}`, "GET");
      setService(data);
    } catch {
      alert("Service not found");
    } finally {
      setLoading(false);
    }
  };

  const buyService = async () => {
    try {
      const order = await apiRequest(
        "/api/orders",
        "POST",
        { serviceId: service._id },
        true
      );
      router.push(`/payment/${order._id}`);
    } catch (err: any) {
      alert(err.message || "Login required");
    }
  };

  useEffect(() => {
    loadService();
  }, []);

  if (loading) return <p className="p-6">Loading…</p>;
  if (!service) return null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* HEADER */}
      <div className="grid md:grid-cols-2 gap-10">
        {/* LEFT */}
        <div>
          <span className="text-xs px-2 py-1 rounded border inline-block mb-3">
            {service.deliveryType === "instant" && "⚡ Instant"}
            {service.deliveryType === "manual" && "🕒 Manual Review"}
            {service.deliveryType === "assisted" && "🤝 Assisted"}
          </span>

          <h1 className="text-3xl font-bold text-[#0F172A]">
            {service.title}
          </h1>

          <p className="text-slate-600 mt-4 leading-relaxed">
            {service.description}
          </p>

          {/* DELIVERY */}
          <div className="mt-6 border rounded-lg p-4 bg-slate-50">
            <h3 className="font-semibold mb-2">Delivery Type</h3>

            {service.deliveryType === "instant" && (
              <p>
                ⚡ Instant delivery. Results are usually processed quickly
                depending on platform checks.
              </p>
            )}

            {service.deliveryType === "manual" && (
              <p>
                🕒 Manual review required. Our team will review your submission
                and update you inside your dashboard.
              </p>
            )}

            {service.deliveryType === "assisted" && (
              <p>
                🤝 Human-assisted onboarding. Our team will personally guide you
                step by step.
              </p>
            )}
          </div>

          {/* REQUIREMENTS */}
          {service.requirements && (
            <div className="mt-6 border rounded-lg p-4">
              <h3 className="font-semibold mb-2">Requirements</h3>
              <p className="text-slate-600">{service.requirements}</p>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="border rounded-xl p-6 h-fit sticky top-24">
          <p className="text-sm text-slate-500">Service Price</p>
          <p className="text-3xl font-bold mb-6">${service.price}</p>

          <button
            onClick={buyService}
            className="w-full bg-[#2563EB] text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Proceed to Payment
          </button>

          <p className="text-xs text-slate-500 mt-4">
            Payment verification is manual. Do not submit fake or reused proof.
          </p>
        </div>
      </div>

      {/* LEGAL */}
      <div className="mt-12 text-sm text-slate-500 border-t pt-4">
        ⚠️ UREMO is an independent service provider. We are not affiliated with
        any platform. Approval depends on platform rules and user history.
      </div>
    </div>
  );
}

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
