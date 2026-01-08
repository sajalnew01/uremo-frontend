"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { apiRequest } from "@/lib/api";

interface App {
  _id: string;
  status: string;
  resumeUrl: string;
  message?: string;
  user?: { email: string };
}

const badge = (s: string) =>
  s === "approved"
    ? "bg-green-600"
    : s === "rejected"
    ? "bg-red-600"
    : "bg-yellow-600";

export default function AdminApplyWork() {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await apiRequest("/api/apply-work/admin", "GET", null, true);
      setApps(data);
    } catch (err: any) {
      alert(err.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: string, status: string) => {
    try {
      setUpdatingId(id);
      await apiRequest(`/api/apply-work/admin/${id}`, "PUT", { status }, true);
      load();
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin — Applications</h1>

      {loading && <p className="text-sm text-[#9CA3AF]">Loading...</p>}

      {!loading &&
        apps.map((a) => (
          <Card key={a._id}>
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold">{a.user?.email}</p>
                <p className="text-sm text-[#9CA3AF] mt-1">
                  {a.message || "No message"}
                </p>

                <a
                  href={a.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 text-[#3B82F6] text-sm"
                >
                  View resume
                </a>
              </div>

              <div className="text-right space-y-2">
                <span
                  className={`px-2 py-1 text-xs rounded ${badge(a.status)}`}
                >
                  {a.status}
                </span>

                <div className="space-x-2">
                  <button
                    disabled={updatingId === a._id}
                    onClick={() => update(a._id, "approved")}
                    className="px-3 py-1 bg-green-600 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updatingId === a._id ? "..." : "Approve"}
                  </button>
                  <button
                    disabled={updatingId === a._id}
                    onClick={() => update(a._id, "rejected")}
                    className="px-3 py-1 bg-red-600 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updatingId === a._id ? "..." : "Reject"}
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}

      {!loading && apps.length === 0 && (
        <Card>
          <p className="text-sm text-[#9CA3AF]">No applications yet.</p>
        </Card>
      )}
    </div>
  );
}
