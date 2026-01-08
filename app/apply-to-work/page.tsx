"use client";

import { useState } from "react";
import Card from "@/components/Card";
import { apiRequest } from "@/lib/api";

export default function ApplyToWorkPage() {
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!category) {
      alert("Please select a category");
      return;
    }

    if (!resume) {
      alert("Resume upload is required");
      return;
    }

    const formData = new FormData();
    formData.append("category", category);
    formData.append("message", message);
    formData.append("resume", resume);

    try {
      setLoading(true);
      await apiRequest("/api/apply-work", "POST", formData, true, true);

      alert("Application submitted successfully");
      window.location.href = "/dashboard";
    } catch (err: any) {
      alert(err.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Apply to Work</h1>
        <p className="text-[#9CA3AF]">
          Apply for internal roles. All applications are manually reviewed.
        </p>
      </div>

      {/* Application Form */}
      <Card title="Application Details">
        {/* Category */}
        <div className="mb-4">
          <label className="text-sm text-[#9CA3AF] block mb-1">Category</label>
          <select
            className="w-full p-2 bg-transparent border border-[#1F2937] rounded"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Select category</option>
            <option value="kyc_assistant">KYC / Onboarding Assistant</option>
            <option value="verification_reviewer">Verification Reviewer</option>
            <option value="operations_support">Operations Support</option>
          </select>
        </div>

        {/* Message */}
        <div className="mb-4">
          <label className="text-sm text-[#9CA3AF] block mb-1">
            Message (optional)
          </label>
          <textarea
            className="w-full p-2 bg-transparent border border-[#1F2937] rounded"
            rows={4}
            placeholder="Briefly explain why you're suitable"
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        {/* Resume */}
        <div className="mb-6">
          <label className="text-sm text-[#9CA3AF] block mb-1">
            Resume (PDF preferred)
          </label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setResume(e.target.files?.[0] || null)}
          />
        </div>

        {/* Submit */}
        <button
          onClick={submit}
          disabled={loading}
          className="px-4 py-2 bg-[#22C55E] text-black rounded disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Application"}
        </button>
      </Card>

      {/* Trust Note */}
      <Card>
        <p className="text-xs text-[#9CA3AF]">
          ⚠️ Submitting an application does not guarantee approval. UREMO
          reviews applications manually based on current operational needs.
        </p>
      </Card>
    </div>
  );
}
