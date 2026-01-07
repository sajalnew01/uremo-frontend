"use client";

import { useState } from "react";
import Container from "@/components/Container";
import { apiRequest } from "@/lib/api";

export default function ApplyToWork() {
  const [resume, setResume] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputKey, setInputKey] = useState(0);

  const submit = async () => {
    if (!resume) {
      alert("Please upload your resume");
      return;
    }

    const formData = new FormData();
    formData.append("resume", resume);
    formData.append("message", message);

    try {
      setLoading(true);
      await apiRequest("/api/apply-work", "POST", formData, true, true);
      alert("Application submitted successfully");
      setMessage("");
      setResume(null);
      setInputKey((k) => k + 1);
    } catch (err: any) {
      alert(err.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <h1 className="text-2xl font-bold mb-4">Apply to Work</h1>

      <input
        type="file"
        accept=".pdf,.jpg,.png"
        onChange={(e) => setResume(e.target.files?.[0] || null)}
        key={inputKey}
        className="mb-4"
      />

      <textarea
        placeholder="Why should we hire you? (optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full p-2 mb-4 bg-black border border-gray-700"
      />

      <button
        onClick={submit}
        disabled={loading}
        className="px-4 py-2 border border-white"
      >
        {loading ? "Submitting..." : "Submit Application"}
      </button>
    </Container>
  );
}
