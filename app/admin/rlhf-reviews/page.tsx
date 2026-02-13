"use client";

import { useEffect, useState, Suspense } from "react";
import { apiRequest } from "@/lib/api";
import ConfirmModal from "@/components/admin/v2/ConfirmModal";

// ── Types ───────────────────────────────────────
interface Submission {
  _id: string;
  projectId: { _id: string; title: string; rewardPerTask: number } | null;
  datasetId: { _id: string; name: string; datasetType: string } | null;
  taskId: {
    _id: string;
    prompt: string;
    responseA?: string;
    responseB?: string;
    imageUrl?: string;
  } | null;
  workerId: { _id: string; name: string; email: string } | null;
  answerPayload: any;
  autoScore: number;
  finalScore?: number;
  reviewStatus: "pending_review" | "approved" | "rejected";
  reviewedBy?: { name: string; email: string };
  reviewedAt?: string;
  rewardCredited: boolean;
  rewardAmount?: number;
  createdAt: string;
}

function RlhfReviewContent() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState("pending_review");

  // Review action
  const [reviewTarget, setReviewTarget] = useState<Submission | null>(null);
  const [reviewAction, setReviewAction] = useState<"approved" | "rejected">(
    "approved",
  );
  const [reviewScore, setReviewScore] = useState<number | "">("");
  const [reviewing, setReviewing] = useState(false);

  // Detail view
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadSubmissions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set("reviewStatus", filterStatus);
      const res = await apiRequest<any>(
        `/api/admin/datasets/rlhf/submissions?${params}`,
        "GET",
        null,
        true,
      );
      setSubmissions(res.submissions || []);
    } catch (e: any) {
      setError(e.message || "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubmissions();
  }, [filterStatus]);

  const handleReview = async () => {
    if (!reviewTarget) return;
    setReviewing(true);
    setError(null);
    try {
      await apiRequest(
        `/api/admin/datasets/rlhf/submissions/${reviewTarget._id}/review`,
        "POST",
        {
          action: reviewAction,
          finalScore: reviewScore !== "" ? Number(reviewScore) : undefined,
        },
        true,
      );
      setSuccess(`Submission ${reviewAction}`);
      setReviewTarget(null);
      await loadSubmissions();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setReviewing(false);
    }
  };

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pending_review: "bg-amber-500/20 text-amber-400",
      approved: "bg-green-500/20 text-green-400",
      rejected: "bg-red-500/20 text-red-400",
    };
    return colors[status] || "bg-gray-500/20 text-gray-400";
  };

  const renderAnswer = (sub: Submission) => {
    const payload = sub.answerPayload || {};
    const dt = sub.datasetId?.datasetType || "";

    if (dt === "ranking") {
      return (
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-gray-400">Choice:</span>{" "}
            <span
              className={`font-bold ${payload.choice === "A" ? "text-blue-400" : "text-purple-400"}`}
            >
              Response {payload.choice}
            </span>
          </div>
          {payload.justification && (
            <div>
              <span className="text-gray-400">Justification:</span>
              <p className="text-gray-300 mt-1 whitespace-pre-wrap">
                {payload.justification}
              </p>
            </div>
          )}
        </div>
      );
    }
    if (dt === "generation") {
      return (
        <p className="text-sm text-gray-300 whitespace-pre-wrap">
          {payload.response || "No response"}
        </p>
      );
    }
    if (dt === "red_team") {
      return (
        <div className="space-y-2 text-sm">
          {payload.prompt && (
            <div>
              <span className="text-gray-400">Attack:</span>{" "}
              <span className="text-gray-300">{payload.prompt}</span>
            </div>
          )}
          {payload.explanation && (
            <div>
              <span className="text-gray-400">Explanation:</span>{" "}
              <span className="text-gray-300">{payload.explanation}</span>
            </div>
          )}
        </div>
      );
    }
    if (dt === "fact_check") {
      return (
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-gray-400">Verdict:</span>{" "}
            <span className="font-bold text-white">{payload.verdict}</span>
          </div>
          {payload.sources && (
            <div>
              <span className="text-gray-400">Sources:</span>{" "}
              <span className="text-gray-300">{payload.sources}</span>
            </div>
          )}
          {payload.explanation && (
            <div>
              <span className="text-gray-400">Explanation:</span>{" "}
              <span className="text-gray-300">{payload.explanation}</span>
            </div>
          )}
        </div>
      );
    }
    if (dt === "coding") {
      return (
        <pre className="text-xs text-green-300 bg-[#0d1117] rounded p-2 overflow-auto max-h-40">
          {payload.code}
        </pre>
      );
    }
    if (dt === "multimodal") {
      return (
        <div className="space-y-2 text-sm">
          {payload.description && (
            <p className="text-gray-300">{payload.description}</p>
          )}
          {payload.rating && (
            <div>
              <span className="text-gray-400">Rating:</span>{" "}
              <span className="font-bold text-yellow-400">
                {"⭐".repeat(payload.rating)}
              </span>
            </div>
          )}
        </div>
      );
    }
    return (
      <pre className="text-xs text-gray-300 overflow-auto">
        {JSON.stringify(payload, null, 2)}
      </pre>
    );
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            RLHF Submission Reviews
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Review worker annotations, approve or reject, and credit rewards
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-lg">
          {error}
          <button className="ml-2 underline" onClick={() => setError(null)}>
            dismiss
          </button>
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 text-green-400 text-sm rounded-lg">
          {success}
          <button className="ml-2 underline" onClick={() => setSuccess(null)}>
            dismiss
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {["pending_review", "approved", "rejected", ""].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 text-sm rounded-lg transition ${
              filterStatus === s
                ? "bg-blue-600 text-white"
                : "bg-[#2a2a3a] text-gray-400 hover:bg-[#3a3a4a]"
            }`}
          >
            {s === ""
              ? "All"
              : s.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">
          Loading submissions...
        </div>
      ) : submissions.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No submissions found
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map((sub) => (
            <div
              key={sub._id}
              className="bg-[#1e1e2e] border border-[#2a2a3a] rounded-xl p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-white font-medium">
                      {sub.workerId?.name || sub.workerId?.email || "Unknown"}
                    </span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${statusBadge(sub.reviewStatus)}`}
                    >
                      {sub.reviewStatus.replace("_", " ")}
                    </span>
                    <span className="text-xs text-gray-500">
                      Score: {sub.autoScore}
                      {sub.finalScore !== undefined && ` → ${sub.finalScore}`}
                    </span>
                  </div>
                  <div className="flex gap-3 text-xs text-gray-500 mb-2">
                    <span>Project: {sub.projectId?.title || "?"}</span>
                    <span>
                      Dataset: {sub.datasetId?.name || "?"} (
                      {sub.datasetId?.datasetType || "?"})
                    </span>
                    <span>{new Date(sub.createdAt).toLocaleString()}</span>
                  </div>

                  {/* Task prompt */}
                  <div className="p-2 rounded bg-[#2a2a3a] text-sm text-gray-300 mb-2">
                    <span className="text-xs text-gray-500">Prompt: </span>
                    {sub.taskId?.prompt || "N/A"}
                  </div>

                  {/* Expandable Answer */}
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === sub._id ? null : sub._id)
                    }
                    className="text-xs text-blue-400 hover:text-blue-300 mb-2"
                  >
                    {expandedId === sub._id ? "▼ Hide Answer" : "▶ View Answer"}
                  </button>

                  {expandedId === sub._id && (
                    <div className="mt-2 p-3 rounded-lg bg-[#2a2a3a] border border-[#3a3a4a]">
                      {/* Show task responses for reference (ranking) */}
                      {sub.datasetId?.datasetType === "ranking" &&
                        (sub.taskId?.responseA || sub.taskId?.responseB) && (
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            {sub.taskId?.responseA && (
                              <div className="bg-[#1e1e2e] rounded p-2">
                                <div className="text-xs text-gray-500 mb-1">
                                  Response A
                                </div>
                                <div className="text-xs text-gray-300">
                                  {sub.taskId.responseA}
                                </div>
                              </div>
                            )}
                            {sub.taskId?.responseB && (
                              <div className="bg-[#1e1e2e] rounded p-2">
                                <div className="text-xs text-gray-500 mb-1">
                                  Response B
                                </div>
                                <div className="text-xs text-gray-300">
                                  {sub.taskId.responseB}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      {renderAnswer(sub)}
                      {sub.rewardCredited && (
                        <div className="mt-2 text-xs text-green-400">
                          💰 Reward credited: ${sub.rewardAmount || 0}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {sub.reviewStatus === "pending_review" && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => {
                        setReviewTarget(sub);
                        setReviewAction("approved");
                        setReviewScore("");
                      }}
                      className="px-3 py-1.5 text-xs bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-lg transition"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setReviewTarget(sub);
                        setReviewAction("rejected");
                        setReviewScore("");
                      }}
                      className="px-3 py-1.5 text-xs bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review Modal */}
      {reviewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-[#1e1e2e] border border-[#2a2a3a] rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">
              {reviewAction === "approved" ? "✅ Approve" : "❌ Reject"}{" "}
              Submission
            </h3>
            <div className="text-sm text-gray-400 mb-4">
              <p>
                Worker:{" "}
                {reviewTarget.workerId?.name || reviewTarget.workerId?.email}
              </p>
              <p>Auto Score: {reviewTarget.autoScore}</p>
              {reviewAction === "approved" && (
                <p className="text-green-400 mt-1">
                  Reward: ${reviewTarget.projectId?.rewardPerTask || 0} will be
                  credited
                </p>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-1">
                Override Score (optional)
              </label>
              <input
                type="number"
                value={reviewScore}
                onChange={(e) =>
                  setReviewScore(e.target.value ? Number(e.target.value) : "")
                }
                className="w-full px-3 py-2 bg-[#2a2a3a] border border-[#3a3a4a] rounded-lg text-white text-sm"
                placeholder="Leave empty to keep auto score"
                min={0}
                max={100}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReview}
                disabled={reviewing}
                className={`px-4 py-2 text-sm rounded-lg transition ${
                  reviewAction === "approved"
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-red-600 hover:bg-red-700 text-white"
                } disabled:opacity-50`}
              >
                {reviewing
                  ? "Processing..."
                  : reviewAction === "approved"
                    ? "Approve & Credit"
                    : "Reject"}
              </button>
              <button
                onClick={() => setReviewTarget(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RlhfReviewsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-400">Loading...</div>}>
      <RlhfReviewContent />
    </Suspense>
  );
}
