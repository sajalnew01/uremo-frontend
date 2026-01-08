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

  const load = async () => {
    const data = await apiRequest(
      "/api/apply-work/admin",
      "GET",
      null,
      true
    );
    setApps(data);
  };

  const update = async (id: string, status: string) => {
    await apiRequest(
      `/api/apply-work/admin/${id}`,
      "PUT",
      { status },
      true
    );
    load();
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin — Applications</h1>

      {apps.map((a) => (
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
                className="inline-block mt-2 text-[#3B82F6] text-sm"
              >
                View resume
              </a>
            </div>

            <div className="text-right space-y-2">
              <span
                className={`px-2 py-1 text-xs rounded ${badge(
                  a.status
                )}`}
              >
                {a.status}
              </span>

              <div className="space-x-2">
                <button
                  onClick={() => update(a._id, "approved")}
                  className="px-3 py-1 bg-green-600 rounded text-xs"
                >
                  Approve
                </button>
                <button
                  onClick={() => update(a._id, "rejected")}
                  className="px-3 py-1 bg-red-600 rounded text-xs"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </Card>
      ))}

      {apps.length === 0 && (
        <Card>
          <p className="text-sm text-[#9CA3AF]">
            No applications yet.
          </p>
        </Card>
      )}
    </div>
  );
}

                    >
                      {updatingId === app._id ? "..." : "Reject"}
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
