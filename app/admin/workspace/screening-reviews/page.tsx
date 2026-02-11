"use client";

import Link from "next/link";
import { useEffect, useState, useCallback } from "react";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { getJobRoleCategoryLabel } from "@/lib/categoryLabels";

/**
 * PATCH_90: Admin Screening Review Panel
 * Review and approve/reject hybrid & manual screening submissions
 */

interface ValidationFlag {
  rule: string;
  passed: boolean;
  detail: string;
}

interface RubricItem {
  criteria: string;
  weight: number;
  maxScore: number;
  awarded: number;
}

interface ScreeningSubmission {
  workerId: string;
  workerName: string;
  workerEmail: string;
  screeningId: string;
  screeningTitle: string;
  screeningCategory: string;
  evaluationMode: string;
  passThreshold: number;
  autoScore: number;
  autoPass: boolean;
  submissionStatus: string;
  submittedAt: string;
  answers: any;
  validationFlags: ValidationFlag[];
  rubricBreakdown: RubricItem[];
  rubricTemplate: RubricItem[];
  screeningQuestions: {
    question: string;
    type?: string;
    options: string[];
    points: number;
  }[];
}

export default function AdminScreeningReviewsPage() {
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<ScreeningSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending_review");
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [reviewing, setReviewing] = useState<string | null>(null); // workerId being reviewed

  // PATCH_90: Admin rubric scoring state per submission
  const [adminScores, setAdminScores] = useState<
    Record<
      string,
      {
        rubricBreakdown: RubricItem[];
        adminScore: number;
      }
    >
  >({});

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiRequest(
        `/api/admin/workspace/screening-submissions?status=${statusFilter}`,
        "GET",
        null,
        true,
      );
      setSubmissions(res.submissions || []);

      // Initialize admin scores for each submission
      const scores: Record<
        string,
        { rubricBreakdown: RubricItem[]; adminScore: number }
      > = {};
      for (const sub of res.submissions || []) {
        const key = `${sub.workerId}-${sub.screeningId}`;
        scores[key] = {
          rubricBreakdown: (
            sub.rubricTemplate ||
            sub.rubricBreakdown ||
            []
          ).map((r: RubricItem) => ({
            ...r,
            awarded: r.awarded || 0,
          })),
          adminScore: sub.autoScore || 0,
        };
      }
      setAdminScores(scores);
    } catch (e: any) {
      toast(e?.message || "Failed to load submissions", "error");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const handleReview = async (
    workerId: string,
    screeningId: string,
    action: "approve" | "reject",
  ) => {
    const key = `${workerId}-${screeningId}`;
    const adminData = adminScores[key];
    setReviewing(key);

    try {
      await apiRequest(
        `/api/admin/workspace/screening-submissions/${workerId}/review`,
        "POST",
        {
          screeningId,
          action,
          adminScore: adminData?.adminScore,
          rubricBreakdown: adminData?.rubricBreakdown?.filter((r) =>
            r.criteria.trim(),
          ),
        },
        true,
      );
      toast(
        action === "approve"
          ? "Submission approved — worker quality updated"
          : "Submission rejected",
        action === "approve" ? "success" : "info",
      );
      setExpandedIdx(null);
      loadSubmissions();
    } catch (e: any) {
      toast(e?.message || `Failed to ${action} submission`, "error");
    } finally {
      setReviewing(null);
    }
  };

  const updateAdminRubricScore = (
    key: string,
    rubricIdx: number,
    awarded: number,
  ) => {
    setAdminScores((prev) => {
      const entry = prev[key];
      if (!entry) return prev;
      const updated = [...entry.rubricBreakdown];
      updated[rubricIdx] = { ...updated[rubricIdx], awarded };
      // Recalculate total admin score from rubric
      const totalWeight = updated.reduce((s, r) => s + r.weight, 0);
      const weightedScore =
        totalWeight > 0
          ? updated.reduce(
              (s, r) => s + (r.awarded / r.maxScore) * r.weight * 100,
              0,
            ) / totalWeight
          : entry.adminScore;
      return {
        ...prev,
        [key]: {
          rubricBreakdown: updated,
          adminScore: Math.round(weightedScore),
        },
      };
    });
  };

  const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="u-container max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/admin/workspace/screenings"
          className="text-sm text-slate-400 hover:text-white mb-2 inline-block"
        >
          ← Back to Screenings
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">⏳</span>
            <div>
              <h1 className="text-2xl font-bold">Screening Reviews</h1>
              <p className="text-slate-400 text-sm">
                Review hybrid &amp; manual screening submissions from workers
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-6">
        {["pending_review", "approved", "rejected", "auto_graded"].map(
          (status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                statusFilter === status
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"
                  : "bg-white/5 text-slate-400 hover:bg-white/10 border border-transparent"
              }`}
            >
              {status === "pending_review" && "⏳ Pending Review"}
              {status === "approved" && "✅ Approved"}
              {status === "rejected" && "❌ Rejected"}
              {status === "auto_graded" && "⚡ Auto Graded"}
            </button>
          ),
        )}
      </div>

      {/* Stats */}
      {!loading && (
        <div className="p-3 rounded-lg bg-white/5 border border-white/10 mb-6 flex items-center gap-6 text-sm">
          <span className="text-slate-400">
            Showing{" "}
            <span className="text-white font-medium">{submissions.length}</span>{" "}
            submission{submissions.length !== 1 ? "s" : ""}
          </span>
          {statusFilter === "pending_review" && submissions.length > 0 && (
            <span className="text-amber-400">
              ⚠ {submissions.length} awaiting your review
            </span>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-slate-400">
          Loading submissions...
        </div>
      )}

      {/* Empty State */}
      {!loading && submissions.length === 0 && (
        <div className="card text-center py-12">
          <div className="text-5xl mb-4">
            {statusFilter === "pending_review" ? "✅" : "📋"}
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {statusFilter === "pending_review"
              ? "No Pending Reviews"
              : `No ${statusFilter.replace("_", " ")} submissions`}
          </h3>
          <p className="text-slate-400">
            {statusFilter === "pending_review"
              ? "All screening submissions have been reviewed."
              : "No submissions match this filter."}
          </p>
        </div>
      )}

      {/* Submissions List */}
      {!loading && submissions.length > 0 && (
        <div className="space-y-3">
          {submissions.map((sub, idx) => {
            const key = `${sub.workerId}-${sub.screeningId}`;
            const isExpanded = expandedIdx === idx;
            const adminData = adminScores[key];
            const isReviewing = reviewing === key;

            return (
              <div
                key={key}
                className={`rounded-xl border transition-colors ${
                  isExpanded
                    ? "bg-white/5 border-cyan-500/30"
                    : "bg-white/[0.02] border-white/10 hover:border-white/20"
                }`}
              >
                {/* Summary Row */}
                <button
                  onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                  className="w-full text-left p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-medium text-white">
                          {sub.workerName}
                        </span>
                        <span className="text-xs text-slate-500">
                          {sub.workerEmail}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-400">
                          {getJobRoleCategoryLabel(sub.screeningCategory)}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            sub.evaluationMode === "hybrid"
                              ? "bg-cyan-500/20 text-cyan-400"
                              : "bg-amber-500/20 text-amber-400"
                          }`}
                        >
                          {sub.evaluationMode === "hybrid"
                            ? "⚡ Hybrid"
                            : "👁 Manual"}
                        </span>
                      </div>
                      <div className="text-sm text-slate-400">
                        {sub.screeningTitle} · Submitted{" "}
                        {formatDate(sub.submittedAt)}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Auto Score Indicator */}
                      <div className="text-center">
                        <div
                          className={`text-lg font-bold ${
                            sub.autoPass ? "text-emerald-400" : "text-amber-400"
                          }`}
                        >
                          {sub.autoScore}%
                        </div>
                        <div className="text-xs text-slate-500">Auto Score</div>
                      </div>
                      <span className="text-slate-400 text-lg">
                        {isExpanded ? "▲" : "▼"}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Expanded Detail Panel */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/10 pt-4 space-y-4">
                    {/* Validation Flags */}
                    {sub.validationFlags && sub.validationFlags.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-slate-400 mb-2">
                          Validation Checks
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                          {sub.validationFlags.map((flag, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-sm"
                            >
                              <span
                                className={
                                  flag.passed
                                    ? "text-emerald-400"
                                    : "text-red-400"
                                }
                              >
                                {flag.passed ? "✓" : "✕"}
                              </span>
                              <span className="text-slate-300">
                                {flag.detail}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Worker Answers */}
                    {sub.screeningQuestions && sub.answers && (
                      <div>
                        <h4 className="text-xs font-medium text-slate-400 mb-2">
                          Worker Answers
                        </h4>
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                          {sub.screeningQuestions.map((q, qi) => {
                            const answer = Array.isArray(sub.answers)
                              ? sub.answers[qi]
                              : sub.answers?.[qi];
                            return (
                              <div
                                key={qi}
                                className="p-3 rounded-lg bg-white/5"
                              >
                                <div className="text-sm font-medium text-white mb-1">
                                  Q{qi + 1}: {q.question}
                                </div>
                                {q.options && q.options.length > 0 ? (
                                  <div className="space-y-1">
                                    {q.options.map((opt, oi) => {
                                      const isSelected =
                                        answer === opt ||
                                        (Array.isArray(answer) &&
                                          answer.includes(opt));
                                      return (
                                        <div
                                          key={oi}
                                          className={`text-sm px-2 py-0.5 rounded ${
                                            isSelected
                                              ? "bg-blue-500/20 text-blue-300 font-medium"
                                              : "text-slate-500"
                                          }`}
                                        >
                                          {isSelected ? "● " : "○ "}
                                          {opt}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-sm text-slate-300 bg-white/5 p-2 rounded">
                                    {typeof answer === "string"
                                      ? answer
                                      : JSON.stringify(answer)}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Rubric Scoring (Admin input) */}
                    {adminData && adminData.rubricBreakdown.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-slate-400 mb-2">
                          Rubric Scoring
                        </h4>
                        <div className="space-y-2">
                          {adminData.rubricBreakdown.map((r, ri) => (
                            <div key={ri} className="flex items-center gap-3">
                              <span className="text-sm text-slate-300 flex-1">
                                {r.criteria}
                              </span>
                              <span className="text-xs text-slate-500 w-12 text-right">
                                wt: {r.weight}
                              </span>
                              <div className="flex items-center gap-1">
                                <input
                                  type="number"
                                  min={0}
                                  max={r.maxScore}
                                  value={r.awarded}
                                  onChange={(e) =>
                                    updateAdminRubricScore(
                                      key,
                                      ri,
                                      Math.min(
                                        r.maxScore,
                                        Math.max(
                                          0,
                                          Number(e.target.value) || 0,
                                        ),
                                      ),
                                    )
                                  }
                                  className="input w-16 text-sm text-center"
                                />
                                <span className="text-xs text-slate-500">
                                  / {r.maxScore}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-2 text-right text-sm">
                          <span className="text-slate-400">
                            Calculated Score:{" "}
                          </span>
                          <span className="text-cyan-400 font-bold">
                            {adminData.adminScore}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Manual Admin Score override (when no rubric) */}
                    {adminData && adminData.rubricBreakdown.length === 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-slate-400 mb-2">
                          Admin Score Override
                        </h4>
                        <div className="flex items-center gap-3">
                          <label className="text-sm text-slate-300">
                            Score (%):
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={adminData.adminScore}
                            onChange={(e) =>
                              setAdminScores((prev) => ({
                                ...prev,
                                [key]: {
                                  ...prev[key],
                                  adminScore: Number(e.target.value) || 0,
                                },
                              }))
                            }
                            className="input w-24 text-sm"
                          />
                        </div>
                      </div>
                    )}

                    {/* Action Buttons (only for pending_review) */}
                    {sub.submissionStatus === "pending_review" && (
                      <div className="flex items-center gap-3 pt-3 border-t border-white/10">
                        <button
                          onClick={() =>
                            handleReview(
                              sub.workerId,
                              sub.screeningId,
                              "approve",
                            )
                          }
                          disabled={isReviewing}
                          className="flex-1 py-2 rounded-lg bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 font-medium transition disabled:opacity-50"
                        >
                          {isReviewing ? "Processing..." : "✅ Approve"}
                        </button>
                        <button
                          onClick={() =>
                            handleReview(
                              sub.workerId,
                              sub.screeningId,
                              "reject",
                            )
                          }
                          disabled={isReviewing}
                          className="flex-1 py-2 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 font-medium transition disabled:opacity-50"
                        >
                          {isReviewing ? "Processing..." : "❌ Reject"}
                        </button>
                      </div>
                    )}

                    {/* Already reviewed indicator */}
                    {sub.submissionStatus !== "pending_review" && (
                      <div
                        className={`text-center py-2 rounded-lg text-sm font-medium ${
                          sub.submissionStatus === "approved"
                            ? "bg-emerald-500/10 text-emerald-400"
                            : "bg-red-500/10 text-red-400"
                        }`}
                      >
                        {sub.submissionStatus === "approved"
                          ? "✅ Approved"
                          : "❌ Rejected"}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
