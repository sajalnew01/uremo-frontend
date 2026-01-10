"use client";

import { useEffect, useState } from "react";
import Card from "@/components/Card";
import { apiRequest } from "@/lib/api";

interface Application {
  _id: string;
  user: {
    email: string;
    name?: string;
  };
  message?: string;
  resumeUrl: string;
  resumeOriginalName?: string;
  resumeMimeType?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

const statusColor = (status: string) => {
  switch (status) {
    case "pending":
      return "bg-yellow-600";
    case "approved":
      return "bg-green-600";
    case "rejected":
      return "bg-red-600";
    default:
      return "bg-gray-600";
  }
};

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadApplications = async () => {
    try {
      const data = await apiRequest<Application[]>(
        "/api/apply-work/admin",
        "GET",
        null,
        true
      );
      setApplications(data);
    } catch (err) {
      console.error(err);
      alert("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(id);
    try {
      await apiRequest(
        `/api/apply-work/admin/${id}`,
        "PUT",
        { status: newStatus },
        true
      );
      loadApplications();
    } catch (err) {
      console.error(err);
      alert("Failed to update application");
    } finally {
      setUpdating(null);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin — Applications</h1>

      {loading && <p>Loading applications...</p>}

      {!loading && applications.length === 0 && (
        <Card>
          <p className="text-sm text-[#9CA3AF]">No applications yet.</p>
        </Card>
      )}

      <div className="space-y-4">
        {applications.map((app) => (
          <Card key={app._id} title={app.user.email}>
            <div className="space-y-3">
              {/* User Info */}
              <div className="border-b border-[#1F2937] pb-3">
                <p className="text-sm text-[#9CA3AF]">
                  <strong>Name:</strong> {app.user.name || "N/A"}
                </p>
                <p className="text-sm text-[#9CA3AF] mt-1">
                  <strong>Email:</strong> {app.user.email}
                </p>
                <p className="text-sm text-[#9CA3AF] mt-1">
                  <strong>Applied:</strong>{" "}
                  {new Date(app.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Message */}
              {app.message && (
                <div className="border-b border-[#1F2937] pb-3">
                  <p className="text-sm text-[#9CA3AF]">
                    <strong>Message:</strong>
                  </p>
                  <p className="text-sm mt-1">{app.message}</p>
                </div>
              )}

              {/* Resume Link */}
              <div className="border-b border-[#1F2937] pb-3">
                <a
                  href={app.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={app.resumeOriginalName}
                  className="text-[#3B82F6] underline text-sm"
                >
                  📄 Open / Download Resume
                </a>
              </div>

              {/* Status & Actions */}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <span
                    className={`${statusColor(
                      app.status
                    )} text-white text-xs px-2 py-1 rounded`}
                  >
                    {app.status.toUpperCase()}
                  </span>
                </div>

                <div className="flex gap-2">
                  {app.status !== "approved" && (
                    <button
                      onClick={() => updateStatus(app._id, "approved")}
                      disabled={updating === app._id}
                      className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {updating === app._id ? "..." : "Approve"}
                    </button>
                  )}

                  {app.status !== "rejected" && (
                    <button
                      onClick={() => updateStatus(app._id, "rejected")}
                      disabled={updating === app._id}
                      className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      {updating === app._id ? "..." : "Reject"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
