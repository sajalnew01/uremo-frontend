"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { withCacheBust } from "@/lib/cacheBust";
import { emitServicesRefresh, onServicesRefresh } from "@/lib/events";

// PATCH_19/21: Category and Subcategory constants - synced with backend
const CATEGORIES = [
  { id: "microjobs", label: "Microjobs" },
  { id: "forex_crypto", label: "Forex / Crypto" },
  { id: "banks_gateways_wallets", label: "Banks / Gateways / Wallets" },
  // PATCH_21: New rentals category for account rental services
  { id: "rentals", label: "Rentals (Account Rental Services)" },
];

const SUBCATEGORIES_BY_CATEGORY: Record<
  string,
  { id: string; label: string }[]
> = {
  microjobs: [
    { id: "fresh_account", label: "Fresh Account" },
    { id: "already_onboarded", label: "Already Onboarded" },
  ],
  forex_crypto: [
    {
      id: "forex_platform_creation",
      label: "Forex Platform Creation Assistance",
    },
    {
      id: "crypto_platform_creation",
      label: "Crypto Platform Creation Assistance",
    },
  ],
  banks_gateways_wallets: [
    { id: "banks", label: "Banks" },
    { id: "payment_gateways", label: "Payment Gateways" },
    { id: "wallets", label: "Wallets" },
  ],
  // PATCH_21: Rental subcategories for WhatsApp, LinkedIn, and other verified accounts
  rentals: [
    {
      id: "whatsapp_business_verified",
      label: "WhatsApp Business (Meta Verified)",
    },
    { id: "linkedin_premium_account", label: "LinkedIn Premium Account" },
    { id: "social_media_verified", label: "Social Media Verified Accounts" },
    { id: "email_accounts", label: "Email Accounts (Aged/Verified)" },
  ],
};

export default function AdminServicesPage() {
  const { toast } = useToast();
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [editing, setEditing] = useState<any | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  // PATCH_19: Add subcategory edit state
  const [editSubcategory, setEditSubcategory] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editRequirements, setEditRequirements] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editDeliveryType, setEditDeliveryType] = useState("manual");
  const [editActive, setEditActive] = useState(true);
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editImagePreviewBust, setEditImagePreviewBust] = useState<number>(() =>
    Date.now(),
  );
  // PATCH_17: Edit state for new fields
  const [editListingType, setEditListingType] = useState("");
  const [editPlatform, setEditPlatform] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editProjectName, setEditProjectName] = useState("");
  const [editPayRate, setEditPayRate] = useState("");
  const [editInstantDelivery, setEditInstantDelivery] = useState(false);
  // PATCH_18: Additional edit state
  const [editStatus, setEditStatus] = useState("active");
  const [editCountries, setEditCountries] = useState("");
  const [editShortDescription, setEditShortDescription] = useState("");
  // PATCH_20: Country-based pricing edit state
  const [editCountryPricing, setEditCountryPricing] = useState("");

  // form state
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  // PATCH_19: Add subcategory create state
  const [subcategory, setSubcategory] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [price, setPrice] = useState("");
  const [deliveryType, setDeliveryType] = useState("manual");
  const [images, setImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState("");
  const [imagePreviewBust, setImagePreviewBust] = useState<number>(() =>
    Date.now(),
  );
  // PATCH_17: Create state for new fields
  const [listingType, setListingType] = useState("");
  const [platform, setPlatform] = useState("");
  const [subject, setSubject] = useState("");
  const [projectName, setProjectName] = useState("");
  const [payRate, setPayRate] = useState("");
  const [instantDelivery, setInstantDelivery] = useState(false);
  // PATCH_18: Additional create state
  const [status, setStatus] = useState("active");
  const [countries, setCountries] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  // PATCH_20: Country-based pricing (JSON string input)
  const [countryPricing, setCountryPricing] = useState("");

  // PATCH_19: Get available subcategories based on selected category
  const availableSubcategories = SUBCATEGORIES_BY_CATEGORY[category] || [];
  const editAvailableSubcategories =
    SUBCATEGORIES_BY_CATEGORY[editCategory] || [];

  useEffect(() => {
    if (imageUrl) setImagePreviewBust(Date.now());
  }, [imageUrl]);

  useEffect(() => {
    if (editImageUrl) setEditImagePreviewBust(Date.now());
  }, [editImageUrl]);

  // PATCH_19: Reset subcategory when category changes
  useEffect(() => {
    if (category && availableSubcategories.length > 0) {
      // Auto-select first subcategory if current is invalid
      const validSubcat = availableSubcategories.find(
        (s) => s.id === subcategory,
      );
      if (!validSubcat) {
        setSubcategory(availableSubcategories[0].id);
      }
    }
  }, [category, availableSubcategories, subcategory]);

  // PATCH_19: Reset edit subcategory when edit category changes
  useEffect(() => {
    if (editCategory && editAvailableSubcategories.length > 0) {
      const validSubcat = editAvailableSubcategories.find(
        (s) => s.id === editSubcategory,
      );
      if (!validSubcat) {
        setEditSubcategory(editAvailableSubcategories[0].id);
      }
    }
  }, [editCategory, editAvailableSubcategories, editSubcategory]);

  // PATCH_18: Listen for services:refresh events (e.g., from JarvisX)
  useEffect(() => {
    const cleanup = onServicesRefresh(() => {
      loadServices();
    });
    return cleanup;
  }, []);

  // PATCH_18: Lock body scroll when modal is open
  useEffect(() => {
    if (editing) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [editing]);

  // load services
  const loadServices = async () => {
    try {
      const data = await apiRequest("/api/admin/services", "GET", null, true);
      // PATCH_18: Handle new response format
      const servicesList = Array.isArray(data)
        ? data
        : Array.isArray(data?.services)
          ? data.services
          : [];
      setServices(servicesList);
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
        true,
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

    // PATCH_19: Validate subcategory
    if (!subcategory) {
      toast("Please select a subcategory", "error");
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
          // PATCH_19: Include subcategory
          subcategory,
          description,
          shortDescription: shortDescription || undefined,
          requirements,
          price: Number(price),
          deliveryType,
          images,
          imageUrl,
          // PATCH_17: New fields (keep listingType synced with subcategory for backwards compatibility)
          listingType:
            subcategory === "fresh_account" ||
            subcategory === "already_onboarded"
              ? subcategory
              : listingType || undefined,
          platform: platform || undefined,
          subject: subject || undefined,
          projectName: projectName || undefined,
          payRate: payRate ? Number(payRate) : undefined,
          instantDelivery,
          // PATCH_18: Status and countries
          status: status || "active",
          countries: countries
            ? countries
                .split(",")
                .map((c) => c.trim())
                .filter(Boolean)
            : undefined,
          // PATCH_20: Country-based pricing
          countryPricing: countryPricing
            ? (() => {
                try {
                  return JSON.parse(countryPricing);
                } catch {
                  // Parse simple format like "India:20, USA:25, UK:22"
                  const pricing: Record<string, number> = {};
                  countryPricing.split(",").forEach((pair) => {
                    const [country, priceStr] = pair
                      .split(":")
                      .map((s) => s.trim());
                    if (country && priceStr) {
                      pricing[country] = Number(priceStr);
                    }
                  });
                  return Object.keys(pricing).length > 0 ? pricing : undefined;
                }
              })()
            : undefined,
        },
        true,
      );

      setTitle("");
      setCategory("");
      // PATCH_19: Reset subcategory
      setSubcategory("");
      setDescription("");
      setShortDescription("");
      setRequirements("");
      setPrice("");
      setDeliveryType("manual");
      setImages([]);
      setImageUrl("");
      // PATCH_17: Reset new fields
      setListingType("");
      setPlatform("");
      setSubject("");
      setProjectName("");
      setPayRate("");
      setInstantDelivery(false);
      // PATCH_18: Reset new fields
      setStatus("active");
      setCountries("");
      // PATCH_20: Reset country pricing
      setCountryPricing("");

      await loadServices();
      emitServicesRefresh(); // PATCH_18: Notify buy-service page
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
        true,
      );
      await loadServices();
      emitServicesRefresh(); // PATCH_18: Notify buy-service page
    } catch (err) {
      toast("Failed to update service", "error");
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm("Delete this service?")) return;
    try {
      await apiRequest(`/api/admin/services/${id}`, "DELETE", null, true);
      await loadServices();
      emitServicesRefresh(); // PATCH_18: Notify buy-service page
    } catch (err) {
      toast("Failed to delete service", "error");
    }
  };

  const openEdit = (service: any) => {
    setEditing(service);
    setEditTitle(service?.title || "");
    setEditCategory(service?.category || "");
    // PATCH_19: Load subcategory
    setEditSubcategory(service?.subcategory || service?.listingType || "");
    setEditDescription(service?.description || "");
    setEditRequirements(service?.requirements || "");
    setEditPrice(String(service?.price ?? ""));
    setEditDeliveryType(service?.deliveryType || "manual");
    setEditActive(Boolean(service?.active));
    setEditImageUrl(service?.imageUrl || "");
    // PATCH_17: Load new fields
    setEditListingType(service?.listingType || "");
    setEditPlatform(service?.platform || "");
    setEditSubject(service?.subject || "");
    setEditProjectName(service?.projectName || "");
    setEditPayRate(String(service?.payRate ?? ""));
    setEditInstantDelivery(Boolean(service?.instantDelivery));
    // PATCH_18: Load new fields
    setEditStatus(service?.status || "active");
    setEditCountries(
      Array.isArray(service?.countries) ? service.countries.join(", ") : "",
    );
    setEditShortDescription(service?.shortDescription || "");
    // PATCH_20: Load country pricing
    const cp = service?.countryPricing || {};
    const cpStr = Object.entries(cp)
      .map(([k, v]) => `${k}:${v}`)
      .join(", ");
    setEditCountryPricing(cpStr);
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

    // PATCH_19: Validate subcategory
    if (!editSubcategory) {
      toast("Please select a subcategory", "error");
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
          // PATCH_19: Include subcategory
          subcategory: editSubcategory,
          description: editDescription,
          shortDescription: editShortDescription || undefined,
          requirements: editRequirements,
          price: Number(editPrice),
          deliveryType: editDeliveryType,
          imageUrl: editImageUrl,
          active: editActive,
          // PATCH_17: New fields (keep listingType synced for backwards compatibility)
          listingType:
            editSubcategory === "fresh_account" ||
            editSubcategory === "already_onboarded"
              ? editSubcategory
              : editListingType || undefined,
          platform: editPlatform || undefined,
          subject: editSubject || undefined,
          projectName: editProjectName || undefined,
          payRate: editPayRate ? Number(editPayRate) : undefined,
          instantDelivery: editInstantDelivery,
          // PATCH_18: Status and countries
          status: editStatus || "active",
          countries: editCountries
            ? editCountries
                .split(",")
                .map((c) => c.trim())
                .filter(Boolean)
            : undefined,
          // PATCH_20: Country-based pricing
          countryPricing: editCountryPricing
            ? (() => {
                try {
                  return JSON.parse(editCountryPricing);
                } catch {
                  const pricing: Record<string, number> = {};
                  editCountryPricing.split(",").forEach((pair) => {
                    const [country, priceStr] = pair
                      .split(":")
                      .map((s) => s.trim());
                    if (country && priceStr) {
                      pricing[country] = Number(priceStr);
                    }
                  });
                  return Object.keys(pricing).length > 0 ? pricing : undefined;
                }
              })()
            : undefined,
        },
        true,
      );

      toast("Service updated", "success");
      closeEdit();
      await loadServices();
      emitServicesRefresh(); // PATCH_18: Notify buy-service page
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
        true,
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

        {/* PATCH_19: Category dropdown */}
        <div className="grid grid-cols-2 gap-4">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="u-select"
          >
            <option value="">Select Category *</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.label}
              </option>
            ))}
          </select>

          {/* PATCH_19: Subcategory dropdown */}
          <select
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            className="u-select"
            disabled={!category}
          >
            <option value="">Select Subcategory *</option>
            {availableSubcategories.map((subcat) => (
              <option key={subcat.id} value={subcat.id}>
                {subcat.label}
              </option>
            ))}
          </select>
        </div>

        <input
          placeholder="Short Description (optional, for cards)"
          value={shortDescription}
          onChange={(e) => setShortDescription(e.target.value)}
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

        {/* Status */}
        <div className="grid grid-cols-2 gap-4">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="u-select"
          >
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <input
          placeholder="Countries (comma-separated: India, USA, UK, Global)"
          value={countries}
          onChange={(e) => setCountries(e.target.value)}
          className="u-input"
        />

        {/* PATCH_20: Country-based pricing */}
        <input
          placeholder="Country Pricing (e.g., India:20, USA:25, UK:22)"
          value={countryPricing}
          onChange={(e) => setCountryPricing(e.target.value)}
          className="u-input"
        />
        <p className="text-xs text-slate-500 -mt-2">
          Base price is default. Add country-specific prices to override when
          user filters by country.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <input
            placeholder="Platform (e.g., Appen, Remotasks)"
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="u-input"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input
            placeholder="Subject (e.g., Math, Coding)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="u-input"
          />

          <input
            placeholder="Project Name (e.g., Arrow)"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="u-input"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input
            placeholder="Pay Rate ($/hr)"
            type="number"
            step="0.01"
            value={payRate}
            onChange={(e) => setPayRate(e.target.value)}
            className="u-input"
          />

          <label className="flex items-center gap-3 text-sm text-white">
            <input
              type="checkbox"
              checked={instantDelivery}
              onChange={(e) => setInstantDelivery(e.target.checked)}
              className="w-4 h-4 accent-blue-500"
            />
            Instant Delivery
          </label>
        </div>

        <input
          placeholder="Image URL (hero image for service)"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          className="u-input"
        />

        {imageUrl && (
          <div className="rounded-lg overflow-hidden border border-white/10">
            <img
              src={withCacheBust(imageUrl, imagePreviewBust)}
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
        <div
          className="fixed inset-0 z-50 bg-black/60 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeEdit();
          }}
        >
          <div className="min-h-full flex items-center justify-center p-4 py-8">
            <div
              className="w-full max-w-2xl rounded-xl border border-white/10 bg-[#0B1220] u-modal max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
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

              <div className="p-4 space-y-3 overflow-y-auto flex-1">
                <input
                  placeholder="Title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="u-input"
                />
                {/* Category & Subcategory Dropdowns */}
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="u-select"
                  >
                    <option value="">Select Category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={editSubcategory}
                    onChange={(e) => setEditSubcategory(e.target.value)}
                    className="u-select"
                    disabled={!editCategory}
                  >
                    <option value="">Select Subcategory</option>
                    {editAvailableSubcategories.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  placeholder="Short Description (optional)"
                  value={editShortDescription}
                  onChange={(e) => setEditShortDescription(e.target.value)}
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

                {/* Status */}
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="u-select"
                  >
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <input
                  placeholder="Countries (comma-separated)"
                  value={editCountries}
                  onChange={(e) => setEditCountries(e.target.value)}
                  className="u-input"
                />

                {/* PATCH_20: Country-based pricing */}
                <input
                  placeholder="Country Pricing (e.g., India:20, USA:25)"
                  value={editCountryPricing}
                  onChange={(e) => setEditCountryPricing(e.target.value)}
                  className="u-input"
                />
                <p className="text-xs text-slate-500 -mt-2">
                  Country-specific prices override base price.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="Platform"
                    value={editPlatform}
                    onChange={(e) => setEditPlatform(e.target.value)}
                    className="u-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="Subject"
                    value={editSubject}
                    onChange={(e) => setEditSubject(e.target.value)}
                    className="u-input"
                  />
                  <input
                    placeholder="Project Name"
                    value={editProjectName}
                    onChange={(e) => setEditProjectName(e.target.value)}
                    className="u-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input
                    placeholder="Pay Rate ($/hr)"
                    type="number"
                    step="0.01"
                    value={editPayRate}
                    onChange={(e) => setEditPayRate(e.target.value)}
                    className="u-input"
                  />
                  <label className="flex items-center gap-2 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={editInstantDelivery}
                      onChange={(e) => setEditInstantDelivery(e.target.checked)}
                    />
                    Instant Delivery
                  </label>
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
                      src={withCacheBust(editImageUrl, editImagePreviewBust)}
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

              <div className="p-4 border-t border-white/10 flex items-center justify-end gap-2 flex-shrink-0">
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
        </div>
      )}
    </div>
  );
}
