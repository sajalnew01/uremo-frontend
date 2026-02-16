"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import EmptyState from "@/components/ui/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import { getStatusColor, getStatusLabel } from "@/lib/statusConfig";

/**
 * PATCH_48: My Proofs Page
 * Worker views all their submitted proofs
 */

type Proof = {
  _id: string;
  projectId: {
    _id: string;
    title: string;
    payRate?: number;
    status?: string;
  };
  jobRoleId?: {
    title: string;
  };
  status: "pending" | "approved" | "rejected";
  submissionText: string;
  attachments: { url: string; filename?: string }[];
  rejectionReason?: string;
  createdAt: string;
};

export default function MyProofsPage() {
  const { toast } = useToast();
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadProofs();
  }, [filter]);

  const loadProofs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      const res = await apiRequest(
        `/api/workspace/my-proofs?${params.toString()}`,
        "GET",
        null,
        true,
      );
      setProofs(res.proofs || []);
    } catch (e: any) {
      toast(e?.message || "Failed to load proofs", "error");
    } finally {
      setLoading(false);
    }
  };

  // PATCH_52: Use centralized status from statusConfig
  const getProofStatusClass = (status: string) => {
    return `px-2 py-1 rounded text-xs font-medium border ${getStatusColor(status)}`;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return "...";
      case "approved":
        return "OK";
      case "rejected":
        return "X";
      default:
        return "Doc";
    }
  };

  return (
    <div className="u-container max-w-4xl">
      {/* Header */}
      <PageHeader
        title="My Proof Submissions"
        description="Track the status of your work proofs"
      />

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {["all", "pending", "approved", "rejected"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm transition-colors ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-white/5 text-slate-400 hover:bg-white/10"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-400">Loading proofs...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && proofs.length === 0 && (
        <EmptyState
          title="No Proofs Found"
          description={
            filter === "all"
              ? "You haven't submitted any proofs yet. Complete a project and submit your work!"
              : `No ${filter} proofs found.`
          }
          icon="Doc"
          ctaText="View My Projects"
          ctaHref="/workspace/projects"
        />
      )}

      {/* Proofs List */}
      {!loading && proofs.length > 0 && (
        <div className="space-y-4">
          {proofs.map((proof) => (
            <div
              key={proof._id}
              className="card hover:border-white/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xl">
                      {getStatusIcon(proof.status)}
                    </span>
                    <h3 className="font-semibold text-white">
                      {proof.projectId?.title || "Unknown Project"}
                    </h3>
                    <span className={getProofStatusClass(proof.status)}>
                      {getStatusLabel(proof.status)}
                    </span>
                  </div>
                  {proof.jobRoleId && (
                    <p className="text-xs text-slate-500 mb-2">
                      Job Role: {proof.jobRoleId.title}
                    </p>
                  )}
                  <p className="text-sm text-slate-300 line-clamp-2">
                    {proof.submissionText}
                  </p>
                  {proof.attachments && proof.attachments.length > 0 && (
                    <p className="text-xs text-slate-500 mt-2">
                      {proof.attachments.length} attachment(s)
                    </p>
                  )}
                  {proof.status === "rejected" && proof.rejectionReason && (
                    <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-sm text-red-300">
                        <span className="font-medium">Reason:</span>{" "}
                        {proof.rejectionReason}
                      </p>
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {proof.projectId?.payRate != null && (
                    <p className="text-sm font-medium text-emerald-400">
                      ${proof.projectId.payRate}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(proof.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
                <Link
                  href={`/workspace/project/${proof.projectId?._id}`}
                  className="btn-secondary text-sm"
                >
                  View Project
                </Link>
                {proof.status === "rejected" && (
                  <Link
                    href={`/workspace/project/${proof.projectId?._id}`}
                    className="btn-primary text-sm"
                  >
                    Resubmit Proof
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
