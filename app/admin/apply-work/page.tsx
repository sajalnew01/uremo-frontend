"use client";

import { useEffect, useState } from "react";
import Container from "@/components/Container";
import { apiRequest } from "@/lib/api";

interface Application {
  _id: string;
  resumeUrl: string;
  message?: string;
  status: string;
  user: {
    email: string;
  };
}

export default function AdminApplyWorkPage() {
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const loadApplications = async () => {
    try {
      const data = await apiRequest("/api/apply-work/admin", "GET", null, true);
      setApps(data);
    } catch (err: any) {
      alert(err.message || "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await apiRequest(`/api/apply-work/admin/${id}`, "PUT", { status }, true);
      loadApplications();
    } catch (err: any) {
      alert("Update failed");
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  return (
    <Container>
      <h1 className="text-2xl font-bold mb-6">Apply-to-Work Applications</h1>

      {loading && <p>Loading...</p>}

      {!loading && apps.length === 0 && <p>No applications found.</p>}

      {!loading && apps.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-700">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="p-3 text-left">User</th>
                <th className="p-3">Resume</th>
                <th className="p-3">Message</th>
                <th className="p-3">Status</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {apps.map((app) => (
                <tr key={app._id} className="border-b border-gray-800">
                  <td className="p-3">{app.user.email}</td>

                  <td className="p-3">
                    <a
                      href={app.resumeUrl}
                      target="_blank"
                      className="underline"
                    >
                      View
                    </a>
                  </td>

                  <td className="p-3">{app.message || "-"}</td>

                  <td className="p-3 capitalize">{app.status}</td>

                  <td className="p-3 flex gap-2">
                    <button
                      onClick={() => updateStatus(app._id, "approved")}
                      className="px-3 py-1 bg-green-600 rounded"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateStatus(app._id, "rejected")}
                      className="px-3 py-1 bg-red-600 rounded"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Container>
  );
}
