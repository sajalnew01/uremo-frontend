"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { apiRequest } from "@/lib/api";

interface Service {
  _id: string;
  name: string;
  platform: string;
  price: number;
  serviceType: string;
  active: boolean;
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);

  // new service form
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("");
  const [price, setPrice] = useState("");
  const [serviceType, setServiceType] = useState("");

  const loadServices = async () => {
    const data = await apiRequest("/api/admin/services", "GET", null, true);
    setServices(data);
  };

  const createService = async () => {
    if (!name || !platform || !price || !serviceType) {
      alert("All fields required");
      return;
    }

    setLoading(true);
    await apiRequest(
      "/api/admin/services",
      "POST",
      {
        name,
        platform,
        price: Number(price),
        serviceType,
        description: "Admin-created service",
      },
      true
    );
    setLoading(false);

    setName("");
    setPlatform("");
    setPrice("");
    setServiceType("");
    loadServices();
  };

  const toggle = async (id: string, active: boolean) => {
    await apiRequest(
      `/api/admin/services/${id}`,
      "PUT",
      { active: !active },
      true
    );
    loadServices();
  };

  useEffect(() => {
    loadServices();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin — Services</h1>

      {/* Create Service */}
      <Card title="Create Service">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            placeholder="Service name"
            className="p-2 border border-[#1F2937] bg-transparent rounded"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            placeholder="Platform (Outlier, Handshake...)"
            className="p-2 border border-[#1F2937] bg-transparent rounded"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          />
          <input
            placeholder="Price"
            type="number"
            className="p-2 border border-[#1F2937] bg-transparent rounded"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <select
            className="p-2 border border-[#1F2937] bg-transparent rounded"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
          >
            <option value="">Select type</option>
            <option value="onboarding_assistance">Onboarding Assistance</option>
            <option value="verification_support">Verification Support</option>
            <option value="readiness_check">Readiness Check</option>
            <option value="custom_request">Custom Request</option>
          </select>
        </div>

        <button
          onClick={createService}
          disabled={loading}
          className="mt-4 px-4 py-2 bg-[#22C55E] text-black rounded disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Service"}
        </button>
      </Card>

      {/* Service List */}
      <Card title="Existing Services">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1F2937] text-left">
              <th className="p-2">Name</th>
              <th className="p-2">Platform</th>
              <th className="p-2">Type</th>
              <th className="p-2">Price</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s._id} className="border-b border-[#1F2937]">
                <td className="p-2">{s.name}</td>
                <td className="p-2">{s.platform}</td>
                <td className="p-2">{s.serviceType}</td>
                <td className="p-2">${s.price}</td>
                <td className="p-2">
                  <button
                    onClick={() => toggle(s._id, s.active)}
                    className={`px-2 py-1 rounded text-xs ${
                      s.active ? "bg-green-600" : "bg-gray-600"
                    }`}
                  >
                    {s.active ? "Active" : "Inactive"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {services.length === 0 && (
          <p className="text-sm text-[#9CA3AF] mt-3">
            No services created yet.
          </p>
        )}
      </Card>
    </div>
  );
}
