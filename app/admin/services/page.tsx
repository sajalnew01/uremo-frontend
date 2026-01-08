"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

export default function AdminServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [price, setPrice] = useState("");
  const [deliveryType, setDeliveryType] = useState("manual");
  const [images, setImages] = useState<string[]>([]);

  // load services
  const loadServices = async () => {
    try {
      const data = await apiRequest("/api/admin/services", "GET", null, true);
      setServices(data);
    } catch (err) {
      console.error(err);
    }
  };

  // upload images (cloudinary already wired)
  const uploadImages = async (files: FileList | null) => {
    if (!files) return;
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("images", f));

    try {
      const res = await apiRequest(
        "/api/admin/upload-images",
        "POST",
        formData,
        true,
        true
      );
      setImages(res.urls);
    } catch (err) {
      alert("Failed to upload images");
    }
  };

  // create service
  const createService = async () => {
    if (!title || !category || !description || !price) {
      alert("Missing required fields");
      return;
    }

    setLoading(true);
    try {
      await apiRequest(
        "/api/admin/services",
        "POST",
        {
          title,
          category,
          description,
          requirements,
          price: Number(price),
          deliveryType,
          images,
        },
        true
      );

      setTitle("");
      setCategory("");
      setDescription("");
      setRequirements("");
      setPrice("");
      setDeliveryType("manual");
      setImages([]);

      loadServices();
    } catch (err: any) {
      alert(err.message || "Failed to create service");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      await apiRequest(
        `/api/admin/services/${id}`,
        "PUT",
        { active: !active },
        true
      );
      loadServices();
    } catch (err) {
      alert("Failed to update service");
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    try {
      await apiRequest(`/api/admin/services/${id}`, "DELETE", null, true);
      loadServices();
    } catch (err) {
      alert("Failed to delete service");
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Admin · Services</h1>

      {/* CREATE FORM */}
      <div className="border border-[#1F2937] p-6 rounded-lg bg-[#0F172A] space-y-4">
        <h2 className="font-semibold text-lg">Create New Service</h2>

        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-3 border border-[#1F2937] rounded bg-[#020617] text-white"
        />

        <input
          placeholder="Category (KYC / Onboarding / Gig)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full p-3 border border-[#1F2937] rounded bg-[#020617] text-white"
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-3 border border-[#1F2937] rounded bg-[#020617] text-white"
        />

        <textarea
          placeholder="Requirements (what user must provide)"
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          className="w-full p-3 border border-[#1F2937] rounded bg-[#020617] text-white"
        />

        <input
          placeholder="Price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full p-3 border border-[#1F2937] rounded bg-[#020617] text-white"
        />

        <select
          value={deliveryType}
          onChange={(e) => setDeliveryType(e.target.value)}
          className="w-full p-3 border border-[#1F2937] rounded bg-[#020617] text-white"
        >
          <option value="manual">Manual</option>
          <option value="assisted">Assisted</option>
          <option value="instant">Instant</option>
        </select>

        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => uploadImages(e.target.files)}
          className="text-white"
        />

        <div className="flex gap-2 flex-wrap">
          {images.map((img) => (
            <img
              key={img}
              src={img}
              alt="preview"
              className="w-20 h-20 object-cover rounded border border-[#1F2937]"
            />
          ))}
        </div>

        <button
          onClick={createService}
          disabled={loading}
          className="w-full bg-[#22C55E] px-4 py-3 rounded text-black font-semibold disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Service"}
        </button>
      </div>

      {/* SERVICES LIST */}
      <div className="border border-[#1F2937] rounded-lg overflow-hidden bg-[#0F172A]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1F2937]">
              <th className="p-4 text-left">Title</th>
              <th className="p-4 text-left">Category</th>
              <th className="p-4 text-left">Price</th>
              <th className="p-4 text-left">Type</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s._id} className="border-b border-[#1F2937]">
                <td className="p-4">{s.title}</td>
                <td className="p-4">{s.category}</td>
                <td className="p-4 font-semibold">${s.price}</td>
                <td className="p-4 text-xs text-[#9CA3AF]">{s.deliveryType}</td>
                <td className="p-4">
                  <button
                    onClick={() => toggleActive(s._id, s.active)}
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      s.active
                        ? "bg-green-600 text-white"
                        : "bg-gray-600 text-white"
                    }`}
                  >
                    {s.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => deleteService(s._id)}
                    className="text-red-500 hover:text-red-400 text-sm"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {services.length === 0 && (
          <div className="p-8 text-center text-[#9CA3AF]">
            No services yet. Create one above.
          </div>
        )}
      </div>
    </div>
  );
}
