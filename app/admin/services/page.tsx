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
  shortDescription?: string;
  description?: string;
  images?: string[];
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);

  // new service form
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState("");
  const [price, setPrice] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const loadServices = async () => {
    const data = await apiRequest("/api/admin/services", "GET", null, true);
    setServices(data);
  };

  const createService = async () => {
    if (
      !name ||
      !platform ||
      !price ||
      !serviceType ||
      !shortDescription ||
      !description
    ) {
      alert("All fields required");
      return;
    }

    setLoading(true);
    try {
      await apiRequest(
        "/api/admin/services",
        "POST",
        {
          name,
          platform,
          price: Number(price),
          serviceType,
          description,
          shortDescription,
          images,
        },
        true
      );

      setName("");
      setPlatform("");
      setPrice("");
      setServiceType("");
      setShortDescription("");
      setDescription("");
      setImages([]);
      loadServices();
    } catch (err) {
      console.error(err);
      alert("Could not create service");
    } finally {
      setLoading(false);
    }
  };

  const uploadImages = async (files: FileList | null) => {
    if (!files) return;

    const fd = new FormData();
    Array.from(files).forEach((file) => fd.append("images", file));

    setUploading(true);
    try {
      const res = await apiRequest(
        "/api/admin/upload-images",
        "POST",
        fd,
        true,
        true
      );
      setImages(res.urls);
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
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
            placeholder="Short description"
            className="p-2 border border-[#1F2937] bg-transparent rounded md:col-span-2"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
          />
          <textarea
            placeholder="Long description"
            className="p-2 border border-[#1F2937] bg-transparent rounded md:col-span-2"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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

        <div className="mt-4">
          <label className="text-sm text-[#9CA3AF] block mb-1">
            Service Images
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => uploadImages(e.target.files)}
            className="text-sm"
          />
          {uploading && (
            <p className="text-xs text-[#9CA3AF] mt-1">Uploading...</p>
          )}
          <div className="flex gap-2 mt-3 flex-wrap">
            {images.map((url) => (
              <img
                key={url}
                src={url}
                className="w-20 h-20 object-cover rounded border"
                alt="Service"
              />
            ))}
          </div>
        </div>

        <button
          onClick={createService}
          disabled={loading || uploading}
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
