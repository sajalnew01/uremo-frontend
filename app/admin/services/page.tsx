"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

export default function AdminServicesPage() {
  const { toast } = useToast();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [editing, setEditing] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editRequirements, setEditRequirements] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDeliveryType, setEditDeliveryType] = useState("manual");
  const [editActive, setEditActive] = useState(true);
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [price, setPrice] = useState("");
  const [deliveryType, setDeliveryType] = useState("manual");
  const [images, setImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");

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
      toast("Failed to upload images", "error");
    }
  };

  // create service
  const createService = async () => {
    if (!title || !category || !description || !price) {
      toast("Missing required fields", "error");
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
          imageUrl,
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
      setImageUrl("");

      await loadServices();
      toast("Service added successfully and is now live.", "success");
    } catch (err: any) {
      toast(err.message || "Failed to create service", "error");
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
      toast("Failed to update service", "error");
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    try {
      await apiRequest(`/api/admin/services/${id}`, "DELETE", null, true);
      loadServices();
    } catch (err) {
      toast("Failed to delete service", "error");
    }
  };

  const openEdit = (service: any) => {
    setEditing(service);
    setEditTitle(service?.title || "");
    setEditCategory(service?.category || "");
    setEditDescription(service?.description || "");
    setEditRequirements(service?.requirements || "");
    setEditPrice(String(service?.price ?? ""));
    setEditDeliveryType(service?.deliveryType || "manual");
    setEditActive(Boolean(service?.active));
    setEditImageUrl(service?.imageUrl || "");
  };

  const closeEdit = () => {
    setEditing(null);
  };

  const saveEdit = async () => {
    if (!editing?._id) return;

    if (!editTitle || !editCategory || !editDescription || !editPrice) {
      toast("Title, category, description and price required", "error");
      return;
    }

    setEditSaving(true);
    try {
      await apiRequest(
        `/api/admin/services/${editing._id}`,
        "PUT",
        {
          title: editTitle,
          category: editCategory,
          description: editDescription,
          requirements: editRequirements,
          price: Number(editPrice),
          deliveryType: editDeliveryType,
          imageUrl: editImageUrl,
          active: editActive,
        },
        true
      );

      toast("Service updated", "success");
      closeEdit();
      await loadServices();
    } catch (err: any) {
      toast(err?.message || "Failed to update service", "error");
    } finally {
      setEditSaving(false);
    }
  };

  const uploadEditHeroImage = async (files: FileList | null) => {
    if (!files || !files[0]) return;
    const formData = new FormData();
    formData.append("images", files[0]);

    try {
      const res = await apiRequest(
        "/api/admin/upload-images",
        "POST",
        formData,
        true,
        true
      );

      const url = Array.isArray(res?.urls) ? res.urls[0] : "";
      if (!url) {
        toast("Upload succeeded but no URL returned", "error");
        return;
      }

      setEditImageUrl(url);
      toast("Hero image uploaded", "success");
    } catch (err: any) {
      toast(err?.message || "Failed to upload image", "error");
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
          className="u-input"
        />

        <input
          placeholder="Category (KYC / Onboarding / Gig)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="u-input"
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="u-textarea"
        />

        <textarea
          placeholder="Requirements (what user must provide)"
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          className="u-textarea"
        />

        <input
          placeholder="Price"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="u-input"
        />

        <select
          value={deliveryType}
          onChange={(e) => setDeliveryType(e.target.value)}
          className="u-select"
        >
          <option value="manual">Manual</option>
          <option value="assisted">Assisted</option>
          <option value="instant">Instant</option>
        </select>

        <input
          placeholder="Image URL (hero image for service)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="u-input"
        />

        {imageUrl && (
          <div className="rounded-lg overflow-hidden border border-white/10">
            <img
              src={imageUrl}
              alt="preview"
              className="w-full h-40 object-cover"
            />
          </div>
        )}

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
          className="w-full btn-primary disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Service"}
        </button>
      </div>

      {/* SERVICES LIST */}
      <div className="border border-[#1F2937] rounded-lg overflow-hidden bg-[#0F172A]">
        <div className="overflow-x-auto">
          <table className="min-w-[760px] w-full text-sm">
            <thead>
              <tr className="text-left sticky top-0 bg-[#0B1220]/90 backdrop-blur border-b border-white/10">
                <th className="p-4 text-xs tracking-widest text-[#9CA3AF]">
                  Title
                </th>
                <th className="p-4 text-xs tracking-widest text-[#9CA3AF]">
                  Category
                </th>
                <th className="p-4 text-xs tracking-widest text-[#9CA3AF]">
                  Price
                </th>
                <th className="p-4 text-xs tracking-widest text-[#9CA3AF]">
                  Type
                </th>
                <th className="p-4 text-xs tracking-widest text-[#9CA3AF]">
                  Status
                </th>
                <th className="p-4 text-xs tracking-widest text-[#9CA3AF]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {services.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-[#9CA3AF]">
                    No records yet.
                  </td>
                </tr>
              ) : (
                services.map((s, rowIdx) => (
                  <tr
                    key={s._id}
                    className={`border-b border-white/10 hover:bg-white/5 transition ${
                      rowIdx % 2 === 0 ? "bg-white/[0.02]" : "bg-transparent"
                    }`}
                  >
                    <td className="p-4">{s.title}</td>
                    <td className="p-4">{s.category}</td>
                    <td className="p-4 font-semibold">${s.price}</td>
                    <td className="p-4 text-xs text-[#9CA3AF]">
                      {s.deliveryType}
                    </td>
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
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => openEdit(s)}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteService(s._id)}
                          className="text-red-500 hover:text-red-400 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-[#0B1220] u-modal">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div>
                <p className="text-xs text-[#9CA3AF]">Quick edit</p>
                <h3 className="text-lg font-semibold text-white">
                  {editing.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeEdit}
                className="text-sm text-[#9CA3AF] hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="p-4 space-y-3">
              <input
                placeholder="Title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="u-input"
              />
              <input
                placeholder="Category"
                value={editCategory}
                onChange={(e) => setEditCategory(e.target.value)}
                className="u-input"
              />
              <textarea
                placeholder="Description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="u-textarea"
              />
              <textarea
                placeholder="Requirements"
                value={editRequirements}
                onChange={(e) => setEditRequirements(e.target.value)}
                className="u-textarea"
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  placeholder="Price"
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="u-input"
                />
                <select
                  value={editDeliveryType}
                  onChange={(e) => setEditDeliveryType(e.target.value)}
                  className="u-select"
                >
                  <option value="manual">Manual</option>
                  <option value="assisted">Assisted</option>
                  <option value="instant">Instant</option>
                </select>
              </div>

              <input
                placeholder="Image URL (hero image for service)"
                value={editImageUrl}
                onChange={(e) => setEditImageUrl(e.target.value)}
                className="u-input"
              />

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-xs text-[#9CA3AF]">
                  Upload will set the Image URL automatically.
                </p>
                <label className="px-3 py-2 rounded bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 cursor-pointer">
                  Upload hero image
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => uploadEditHeroImage(e.target.files)}
                  />
                </label>
              </div>

              {editImageUrl && (
                <div className="rounded-lg overflow-hidden border border-white/10">
                  <img
                    src={editImageUrl}
                    alt="preview"
                    className="w-full h-40 object-cover"
                  />
                </div>
              )}

              <label className="flex items-center gap-2 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                />
                Active
              </label>
            </div>

            <div className="p-4 border-t border-white/10 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeEdit}
                className="px-4 py-2 rounded bg-white/5 border border-white/10 text-white hover:bg-white/10"
                disabled={editSaving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={editSaving}
                className="px-4 py-2 rounded bg-[#3B82F6] text-white text-sm disabled:opacity-50"
              >
                {editSaving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
