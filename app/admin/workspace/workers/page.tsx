"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";

/**
 * PATCH_44: Admin Workers Management Page
 * View all workers across job roles with status and earnings
 */

interface Worker {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  jobId: {
    _id: string;
    title: string;
  };
  status: string;
  trainingProgress: number;
  screeningUnlocked: boolean;
  screeningPassed: boolean;
  totalEarnings: number;
  createdAt: string;
}

export default function AdminWorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadWorkers();
  }, [page, filter]);

  const loadWorkers = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/workspace/workers?page=${page}&limit=${limit}`;
      if (filter !== "all") {
        url += `&status=${filter}`;
      }

      const res = await apiRequest<any>(url, "GET", null, true);
      setWorkers(res.workers || []);
      setTotal(res.total || 0);
    } catch (e: any) {
      setError(e.message || "Failed to load workers");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      approved:
        "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
      training: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
      screening: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
      active: "bg-green-500/20 text-green-400 border border-green-500/30",
      suspended: "bg-red-500/20 text-red-400 border border-red-500/30",
    };
    return styles[status] || "bg-slate-500/20 text-slate-400";
  };

  return (
    <div className="u-container max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/workspace"
          className="text-sm text-slate-400 hover:text-white mb-2 inline-block"
        >
          ← Workspace Hub
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">👷</span>
            <div>
              <h1 className="text-2xl font-bold">Workers</h1>
              <p className="text-slate-400 text-sm">
                {total} workers across all job roles
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          "all",
          "approved",
          "training",
          "screening",
          "active",
          "suspended",
        ].map((f) => (
          <button
            key={f}
            onClick={() => {
              setFilter(f);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-white/5 text-slate-400 hover:bg-white/10"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 mb-6 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
          <p className="text-red-400 mb-3">{error}</p>
          <button
            onClick={() => loadWorkers()}
            className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition"
          >
            🔄 Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-slate-400">
          Loading workers...
        </div>
      )}

      {/* Workers List */}
      {!loading && workers.length > 0 && (
        <div className="space-y-3">
          {workers.map((worker) => (
            <div
              key={worker._id}
              className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white truncate">
                      {worker.userId?.firstName || "Unknown"}{" "}
                      {worker.userId?.lastName || ""}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${getStatusBadge(
                        worker.status,
                      )}`}
                    >
                      {worker.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 truncate">
                    {worker.userId?.email}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Job: {worker.jobId?.title || "N/A"}
                  </p>
                </div>

                <div className="flex items-center gap-6 text-right shrink-0">
                  <div>
                    <p className="text-sm font-medium text-emerald-400">
                      ${worker.totalEarnings?.toFixed(2) || "0.00"}
                    </p>
                    <p className="text-xs text-slate-500">Earnings</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-400">
                      {worker.trainingProgress || 0}%
                    </p>
                    <p className="text-xs text-slate-500">Training</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {worker.screeningPassed ? (
                      <span className="text-emerald-400 text-lg">✓</span>
                    ) : worker.screeningUnlocked ? (
                      <span className="text-amber-400 text-lg">⏳</span>
                    ) : (
                      <span className="text-slate-500 text-lg">🔒</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && workers.length === 0 && (
        <div className="text-center py-12">
          <div className="text-5xl mb-4">👷</div>
          <h3 className="text-lg font-semibold text-white mb-2">
            No Workers Found
          </h3>
          <p className="text-slate-400 mb-4">
            {filter === "all"
              ? "No workers have applied yet. Workers will appear here after they apply to job roles."
              : `No workers with "${filter}" status found.`}
          </p>
          {filter !== "all" && (
            <button
              onClick={() => setFilter("all")}
              className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition"
            >
              View All Workers
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {total > limit && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="btn-secondary disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-slate-400">
            Page {page} of {Math.ceil(total / limit)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(total / limit)}
            className="btn-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
