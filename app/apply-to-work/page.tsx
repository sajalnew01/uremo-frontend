"use client";

import { useEffect, useState } from "react";
import Container from "@/components/Container";
import { apiRequest } from "@/lib/api";

export default function ApplyToWork() {
  const [resume, setResume] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadMyApplication = async () => {
    try {
      const data = await apiRequest("/api/apply-work/me", "GET", null, true);
      setApplication(data);
    } catch {}
  };

  useEffect(() => {
    loadMyApplication();
  }, []);

  const submit = async () => {
    if (!resume) return alert("Resume required");

    const fd = new FormData();
    fd.append("resume", resume);
    fd.append("message", message);

    try {
      setLoading(true);
      await apiRequest("/api/apply-work", "POST", fd, true, true);
      alert("Application submitted");
      loadMyApplication();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // If already applied → show status
  if (application) {
    return (
      <Container>
        <h1 className="text-2xl font-bold mb-4">Apply to Work</h1>

        <div className="border p-4 rounded">
          <p>
            <b>Status:</b>{" "}
            <span className="capitalize">{application.status}</span>
          </p>

          {application.status === "approved" && (
            <p className="mt-2 text-green-500">
              ✅ You are approved. Our team will contact you.
            </p>
          )}

          {application.status === "rejected" && (
            <p className="mt-2 text-red-500">❌ Application rejected.</p>
          )}

          {application.status === "pending" && (
            <p className="mt-2 text-yellow-500">⏳ Under review.</p>
          )}
        </div>
      </Container>
    );
  }

  // First-time apply form
  return (
    <Container>
      <h1 className="text-2xl font-bold mb-4">Apply to Work</h1>

      <input
        type="file"
        accept=".pdf,.doc,.docx,.jpg,.png"
        onChange={(e) => setResume(e.target.files?.[0] || null)}
        className="mb-4"
      />

      <textarea
        placeholder="Message (optional)"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="w-full p-2 mb-4 border"
      />

      <button onClick={submit} disabled={loading} className="px-4 py-2 border">
        {loading ? "Submitting..." : "Submit Application"}
      </button>
    </Container>
  );
}
