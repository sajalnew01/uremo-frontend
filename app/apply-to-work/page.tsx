"use client";

import { useState } from "react";

export default function ApplyToWork() {
  const [form, setForm] = useState<any>({});
  const [resume, setResume] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!resume) return alert("Resume required");

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, String(v)));
    fd.append("resume", resume);

    setLoading(true);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/workers/apply`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: fd,
      });

      alert("Application submitted");
      setForm({});
      setResume(null);
    } catch (e: any) {
      alert(e.message || "Failed to submit");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Apply to Work</h1>

      <input
        placeholder="Full Name"
        className="w-full p-2 bg-black border border-zinc-800 rounded"
        onChange={(e) => setForm({ ...form, name: e.target.value })}
      />
      <input
        placeholder="Email"
        className="w-full p-2 bg-black border border-zinc-800 rounded"
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <input
        placeholder="Country"
        className="w-full p-2 bg-black border border-zinc-800 rounded"
        onChange={(e) => setForm({ ...form, country: e.target.value })}
      />
      <textarea
        placeholder="Skills"
        className="w-full p-2 bg-black border border-zinc-800 rounded"
        onChange={(e) => setForm({ ...form, skills: e.target.value })}
      />
      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={(e) => setResume(e.target.files?.[0] || null)}
      />

      <button
        onClick={submit}
        disabled={loading}
        className="bg-white text-black px-4 py-2 rounded disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit"}
      </button>
    </div>
  );
}
