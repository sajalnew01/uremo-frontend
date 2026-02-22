"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import PageHeader from "@/components/ui/PageHeader";
import { EmojiProofs } from "@/components/ui/Emoji";
import { getStatusColor, getStatusLabel } from "@/lib/statusConfig";

/**
 * PATCH_48/55: Admin Project Proofs Page
 * Review and approve/reject worker PROJECT proof submissions
 *
 * SEMANTIC CLARIFICATION (PATCH_55):
 * - This page is for PROJECT PROOF VERIFICATION only
 * - NOT for screening tests or training materials
 * - Proofs are created after workers submit completed project work
 * - Admin approves/rejects the work quality
 */

type Proof = {
  _id: string;
  workerId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
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
  reviewedBy?: {
    firstName: string;
    lastName: string;
  };
  reviewedAt?: string;
  createdAt: string;
};

type Stats = {
  pending: number;
  approved: number;
  rejected: number;
};

export default function AdminProofsPage() {
  const { toast } = useToast();
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [stats, setStats] = useState<Stats>({
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("pending");

  // Modal states
  const [selectedProof, setSelectedProof] = useState<Proof | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadProofs();
  }, [filter]);

  const loadProofs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      const res = await apiRequest(
        `/api/admin/proofs?${params.toString()}`,
        "GET",
        null,
        true,
      );
      setProofs(res.proofs || []);
      setStats(res.stats || { pending: 0, approved: 0, rejected: 0 });
    } catch (e: any) {
      toast(e?.message || "Failed to load proofs", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (proof: Proof) => {
    if (
      !confirm(
        `Approve this proof? The project will be marked complete.\n\nNote: You must credit earnings separately in the Projects section.`,
      )
    ) {
      return;
    }
    setProcessing(true);
    try {
      await apiRequest(
        `/api/admin/proofs/${proof._id}/approve`,
        "PUT",
        {},
        true,
      );
      toast(
        "Proof approved! Project marked complete. Next: credit earnings in Projects.",
        "success",
      );
      loadProofs();
    } catch (e: any) {
      toast(e?.message || "Failed to approve", "error");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedProof || !rejectionReason.trim()) {
      toast("Please provide a rejection reason", "error");
      return;
    }
    setProcessing(true);
    try {
      await apiRequest(
        `/api/admin/proofs/${selectedProof._id}/reject`,
        "PUT",
        { rejectionReason },
        true,
      );
      toast(
        "Proof rejected. Worker has been notified and can resubmit.",
        "success",
      );
      setShowRejectModal(false);
      setSelectedProof(null);
      setRejectionReason("");
      loadProofs();
    } catch (e: any) {
      toast(e?.message || "Failed to reject", "error");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-500/20 text-amber-300";
      case "approved":
        return "bg-emerald-500/20 text-emerald-300";
      case "rejected":
        return "bg-red-500/20 text-red-300";
      default:
        return "bg-slate-500/20 text-slate-300";
    }
  };

  return (
    <div className="u-container max-w-6xl">
      {/* PATCH_79: Header with Clear Purpose */}
      <PageHeader
        title="Project Proofs Review"
        emoji={<EmojiProofs />}
        description="Verify work completion before crediting worker wallets"
      />

      {/* PATCH_79: Wallet Credit Explanation */}
      <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-slate-800/50 to-cyan-500/10 border border-emerald-500/20">
        <div className="flex items-start gap-3">
          <span className="text-2xl">💰</span>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-white mb-1">
              What happens when you approve:
            </h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>
                • <span className="text-emerald-400 font-medium">Approve</span>{" "}
                → Project marked complete →{" "}
                <span className="text-cyan-400">Wallet credit unlocked</span>
              </li>
              <li>
                • <span className="text-red-400 font-medium">Reject</span> →
                Worker notified → Can resubmit proof
              </li>
              <li>
                • After approval, go to{" "}
                <Link
                  href="/admin/workspace/projects"
                  className="text-cyan-400 hover:underline"
                >
                  Projects
                </Link>{" "}
                to credit the worker's wallet
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* PATCH_79: What to do next */}
      {!loading && stats.pending > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="text-sm text-white font-medium">
                {stats.pending} proof{stats.pending > 1 ? "s" : ""} waiting for
                your review
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Review attachments → Click{" "}
                <span className="text-emerald-400">Approve</span> or{" "}
                <span className="text-red-400">Reject</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
          <p className="text-sm text-slate-400">Pending Review</p>
        </div>
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <p className="text-2xl font-bold text-emerald-400">
            {stats.approved}
          </p>
          <p className="text-sm text-slate-400">Approved</p>
        </div>
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
          <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
          <p className="text-sm text-slate-400">Rejected</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {["pending", "all", "approved", "rejected"].map((f) => (
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
            {f === "pending" && stats.pending > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-xs">
                {stats.pending}
              </span>
            )}
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

      {/* Empty State - PATCH_63: Enhanced with helpful next steps */}
      {!loading && proofs.length === 0 && (
        <div className="text-center py-12 card">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-lg font-semibold text-white mb-2">
            No Proofs to Review
          </h3>
          <p className="text-slate-400 mb-4 max-w-md mx-auto">
            {filter === "pending"
              ? "All pending proofs have been reviewed. Great job!"
              : `No proofs with "${filter}" status.`}
          </p>
          <div className="text-sm text-slate-500 space-y-1">
            <p>
              Proofs appear here when workers submit completed project work.
            </p>
            <p className="mt-2">
              <Link
                href="/admin/workspace/projects"
                className="text-cyan-400 hover:underline"
              >
                Check Projects →
              </Link>
              {" | "}
              <Link
                href="/admin/workforce"
                className="text-cyan-400 hover:underline"
              >
                View Workers →
              </Link>
            </p>
          </div>
          {filter !== "pending" && (
            <button
              onClick={() => setFilter("pending")}
              className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition"
            >
              View Pending Proofs
            </button>
          )}
        </div>
      )}

      {/* Proofs List */}
      {!loading && proofs.length > 0 && (
        <div className="space-y-4">
          {proofs.map((proof) => (
            <div
              key={proof._id}
              className="card hover:border-white/20 transition-colors"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">
                      {proof.projectId?.title || "Unknown Project"}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${getStatusBadge(
                        proof.status,
                      )}`}
                    >
                      {proof.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span>
                      👤 {proof.workerId?.firstName || "Unknown"}{" "}
                      {proof.workerId?.lastName || "Worker"}
                    </span>
                    <span>📧 {proof.workerId?.email || "N/A"}</span>
                    {proof.jobRoleId && <span>💼 {proof.jobRoleId.title}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {proof.projectId?.payRate != null && (
                    <p className="text-lg font-bold text-emerald-400">
                      ${proof.projectId.payRate}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    {new Date(proof.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Submission Text */}
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 mb-4">
                <p className="text-sm text-slate-300 whitespace-pre-wrap">
                  {proof.submissionText}
                </p>
              </div>

              {/* Attachments */}
              {proof.attachments && proof.attachments.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-slate-400 mb-2">📎 Attachments:</p>
                  <div className="flex flex-wrap gap-2">
                    {proof.attachments.map((att, idx) => (
                      <a
                        key={idx}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 text-sm hover:bg-blue-500/30 transition-colors"
                      >
                        {att.filename || `Attachment ${idx + 1}`} ↗
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Rejection reason if rejected */}
              {proof.status === "rejected" && proof.rejectionReason && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
                  <p className="text-sm text-red-300">
                    <span className="font-medium">Rejection Reason:</span>{" "}
                    {proof.rejectionReason}
                  </p>
                </div>
              )}

              {/* Review info if reviewed */}
              {proof.reviewedBy && proof.reviewedAt && (
                <p className="text-xs text-slate-500 mb-4">
                  Reviewed by {proof.reviewedBy.firstName}{" "}
                  {proof.reviewedBy.lastName} on{" "}
                  {new Date(proof.reviewedAt).toLocaleDateString()}
                </p>
              )}

              {/* Actions - PATCH_55: Clear semantics for approving/rejecting project work */}
              {proof.status === "pending" && (
                <div className="flex gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => handleApprove(proof)}
                    disabled={processing}
                    className="btn-primary disabled:opacity-50"
                  >
                    ✅ Approve Work & Credit ${proof.projectId?.payRate || 0}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProof(proof);
                      setShowRejectModal(true);
                    }}
                    disabled={processing}
                    className="btn-secondary text-red-400 hover:text-red-300 disabled:opacity-50"
                  >
                    ❌ Reject Work
                  </button>
                </div>
              )}
              {/* PATCH_74: Terminal state finality indicators */}
              {proof.status === "approved" && (
                <div className="flex items-center gap-2 pt-4 border-t border-white/10 text-slate-500 text-sm">
                  <span>🔒 Approved & Final</span>
                  <span className="text-emerald-400/70">
                    — Credit earnings in Projects if not done
                  </span>
                </div>
              )}
              {proof.status === "rejected" && (
                <div className="flex items-center gap-2 pt-4 border-t border-white/10 text-slate-500 text-sm">
                  <span>🔒 Rejected</span>
                  <span className="text-red-400/70">
                    — Worker can resubmit new proof
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal - PATCH_55: Clear semantics */}
      {showRejectModal && selectedProof && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-white/10">
            <h2 className="text-xl font-bold mb-2">❌ Reject Project Work</h2>
            <p className="text-sm text-slate-400 mb-4">
              Reject work submission for &quot;{selectedProof.projectId?.title}
              &quot;
            </p>

            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-1">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why this proof is being rejected..."
                rows={4}
                className="w-full bg-[#1f2937] border border-white/10 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(false);
                  setSelectedProof(null);
                  setRejectionReason("");
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={processing || !rejectionReason.trim()}
                className="btn-primary bg-red-600 hover:bg-red-500 flex-1 disabled:opacity-50"
              >
                {processing ? "Rejecting..." : "Reject Proof"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
