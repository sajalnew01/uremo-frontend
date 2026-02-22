"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import type { Screening, ScreeningType, ScreeningCategory } from "@/types";

/* ─── Types ─── */
interface SubmissionEntry {
  workerId: string;
  userId: string;
  workerName: string;
  workerEmail: string;
  positionTitle: string;
  positionCategory: string;
  workerStatus: string;
  screeningId: string;
  screeningTitle: string;
  evaluationMode: string;
  completedAt: string;
  score: number;
  autoScore?: number;
  autoPass?: boolean;
  submissionStatus: string;
  rubricBreakdown?: Array<{
    criteria: string;
    weight: number;
    maxScore: number;
    awarded: number;
  }>;
  validationFlags?: Array<{ rule: string; passed: boolean; detail: string }>;
  adminScore?: number;
  answers?: Record<string, unknown>;
  screeningQuestions?: Array<{
    question: string;
    type: string;
    options?: string[];
    points?: number;
  }>;
  rubricTemplate?: Array<{
    criteria: string;
    weight: number;
    maxScore: number;
  }>;
  passThreshold?: number;
  _submissionIndex?: number;
}

const SCREENING_TYPES: ScreeningType[] = [
  "mcq",
  "written",
  "ranking",
  "red_team",
  "fact_check",
  "coding",
  "multimodal",
];
const SCREENING_CATEGORIES: ScreeningCategory[] = [
  "microjobs",
  "writing",
  "teaching",
  "coding_math",
  "outlier",
  "other",
];

export function ScreeningsTab() {
  const qc = useQueryClient();
  const [subTab, setSubTab] = useState<"list" | "submissions">("list");
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedScreening, setSelectedScreening] = useState<Screening | null>(
    null,
  );
  const [selectedSubmission, setSelectedSubmission] =
    useState<SubmissionEntry | null>(null);
  const [subFilter, setSubFilter] = useState("pending_review");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 4000);
  };

  /* ─── Screenings list ─── */
  const screeningsQuery = useQuery<{ screenings: Screening[] }>({
    queryKey: ["admin-screenings"],
    queryFn: () =>
      apiRequest(EP.ADMIN_WORKSPACE_SCREENINGS, "GET", undefined, true),
  });

  /* ─── Submissions ─── */
  const submissionsQuery = useQuery<{
    success: boolean;
    submissions: SubmissionEntry[];
    count: number;
  }>({
    queryKey: ["admin-screening-submissions", subFilter],
    queryFn: () =>
      apiRequest(
        `${EP.ADMIN_WORKSPACE_SCREENING_SUBMISSIONS}?status=${subFilter}`,
        "GET",
        undefined,
        true,
      ),
  });

  /* ─── Clone mutation ─── */
  const cloneMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(
        EP.ADMIN_WORKSPACE_SCREENING_CLONE(id),
        "POST",
        undefined,
        true,
      ),
    onSuccess: () => {
      showToast("Screening cloned", true);
      qc.invalidateQueries({ queryKey: ["admin-screenings"] });
    },
    onError: (e: Error) => showToast(e.message || "Clone failed", false),
  });

  /* ─── Create mutation ─── */
  const createMutation = useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiRequest(EP.ADMIN_WORKSPACE_SCREENINGS, "POST", body, true),
    onSuccess: () => {
      showToast("Screening created", true);
      setCreateOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-screenings"] });
    },
    onError: (e: Error) => showToast(e.message || "Create failed", false),
  });

  /* ─── Review mutation ─── */
  const reviewMutation = useMutation({
    mutationFn: (args: { workerId: string; body: Record<string, unknown> }) =>
      apiRequest<Record<string, unknown>>(
        EP.ADMIN_WORKSPACE_SCREENING_REVIEW(args.workerId),
        "POST",
        args.body,
        true,
      ),
    onSuccess: (res: Record<string, unknown>) => {
      showToast(`Submission ${res.action ?? "reviewed"}`, true);
      setSelectedSubmission(null);
      qc.invalidateQueries({ queryKey: ["admin-screening-submissions"] });
      qc.invalidateQueries({ queryKey: ["admin-workers"] });
    },
    onError: (e: Error) => showToast(e.message || "Review failed", false),
  });

  const screenings = screeningsQuery.data?.screenings ?? [];
  const submissions = submissionsQuery.data?.submissions ?? [];

  return (
    <div className="flex flex-col gap-4">
      {/* Toast */}
      {toast && (
        <div
          className={`rounded-md px-3 py-2 text-xs font-medium ${toast.ok ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}
        >
          {toast.msg}
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => setSubTab("list")}
          className={`text-sm font-medium ${subTab === "list" ? "text-white" : "text-[var(--muted)]"}`}
        >
          Screenings ({screenings.length})
        </button>
        <button
          onClick={() => setSubTab("submissions")}
          className={`text-sm font-medium ${subTab === "submissions" ? "text-white" : "text-[var(--muted)]"}`}
        >
          Submissions ({submissionsQuery.data?.count ?? 0})
        </button>
        {subTab === "list" && (
          <button
            onClick={() => setCreateOpen(true)}
            className="ml-auto rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
          >
            + New Screening
          </button>
        )}
      </div>

      {subTab === "list" && (
        <ScreeningList
          screenings={screenings}
          isLoading={screeningsQuery.isLoading}
          onClone={(id) => cloneMutation.mutate(id)}
          cloning={cloneMutation.isPending}
          onSelect={setSelectedScreening}
        />
      )}

      {subTab === "submissions" && (
        <SubmissionList
          submissions={submissions}
          isLoading={submissionsQuery.isLoading}
          filter={subFilter}
          onFilterChange={setSubFilter}
          onSelect={setSelectedSubmission}
        />
      )}

      {/* Screening detail overlay */}
      {selectedScreening && (
        <ScreeningDetailPanel
          screening={selectedScreening}
          onClose={() => setSelectedScreening(null)}
        />
      )}

      {/* Submission inspector overlay */}
      {selectedSubmission && (
        <SubmissionInspector
          submission={selectedSubmission}
          onClose={() => setSelectedSubmission(null)}
          onReview={(action, adminScore, rubricBreakdown) =>
            reviewMutation.mutate({
              workerId: selectedSubmission.workerId,
              body: {
                screeningId: selectedSubmission.screeningId,
                action,
                ...(adminScore != null ? { adminScore } : {}),
                ...(rubricBreakdown ? { rubricBreakdown } : {}),
              },
            })
          }
          reviewing={reviewMutation.isPending}
        />
      )}

      {/* Create screening modal */}
      {createOpen && (
        <CreateScreeningModal
          onClose={() => setCreateOpen(false)}
          onCreate={(data) => createMutation.mutate(data)}
          creating={createMutation.isPending}
        />
      )}
    </div>
  );
}

/* ─── Sub-components ─── */

function ScreeningList({
  screenings,
  isLoading,
  onClone,
  cloning,
  onSelect,
}: {
  screenings: Screening[];
  isLoading: boolean;
  onClone: (id: string) => void;
  cloning: boolean;
  onSelect: (s: Screening) => void;
}) {
  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }
  if (screenings.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-[var(--muted)]">
        No screenings created yet
      </div>
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {screenings.map((s) => (
        <div
          key={s._id}
          className="rounded-lg border border-[var(--border)] bg-[var(--panel)] p-4"
        >
          <div className="flex items-start justify-between">
            <button
              onClick={() => onSelect(s)}
              className="text-left text-sm font-medium text-white hover:underline"
            >
              {s.title}
            </button>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                s.active
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-red-500/15 text-red-400"
              }`}
            >
              {s.active ? "Active" : "Inactive"}
            </span>
          </div>
          <div className="mt-1 text-xs text-[var(--muted)]">
            {s.category} / {s.screeningType}
          </div>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-[var(--muted)]">
            <span>{s.questions?.length ?? 0} questions</span>
            <span>Pass: {s.passingScore}%</span>
            <span>{s.timeLimit}min</span>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => onClone(s._id)}
              disabled={cloning}
              className="rounded bg-purple-500/15 px-2.5 py-1 text-[11px] font-medium text-purple-400 hover:bg-purple-500/25 disabled:opacity-50"
            >
              Clone
            </button>
            <button
              onClick={() => onSelect(s)}
              className="rounded bg-blue-500/15 px-2.5 py-1 text-[11px] font-medium text-blue-400 hover:bg-blue-500/25"
            >
              Inspect
            </button>
          </div>
          <div className="mt-2 font-mono text-[9px] text-[var(--muted)] opacity-50">
            {s._id}
          </div>
        </div>
      ))}
    </div>
  );
}

function SubmissionList({
  submissions,
  isLoading,
  filter,
  onFilterChange,
  onSelect,
}: {
  submissions: SubmissionEntry[];
  isLoading: boolean;
  filter: string;
  onFilterChange: (f: string) => void;
  onSelect: (s: SubmissionEntry) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        {["pending_review", "approved", "rejected", "auto_graded"].map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={`rounded px-2.5 py-1 text-xs font-medium ${
              filter === f
                ? "bg-blue-500/20 text-blue-400"
                : "text-[var(--muted)] hover:text-white"
            }`}
          >
            {f.replace("_", " ")}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : submissions.length === 0 ? (
        <div className="py-8 text-center text-sm text-[var(--muted)]">
          No submissions with status: {filter}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--panel)]">
                <th className="px-3 py-2 text-left font-semibold text-[var(--muted)]">
                  Worker
                </th>
                <th className="px-3 py-2 text-left font-semibold text-[var(--muted)]">
                  Screening
                </th>
                <th className="px-3 py-2 text-left font-semibold text-[var(--muted)]">
                  Score
                </th>
                <th className="px-3 py-2 text-left font-semibold text-[var(--muted)]">
                  Auto
                </th>
                <th className="px-3 py-2 text-left font-semibold text-[var(--muted)]">
                  Status
                </th>
                <th className="px-3 py-2 text-left font-semibold text-[var(--muted)]">
                  Date
                </th>
                <th className="px-3 py-2 text-left font-semibold text-[var(--muted)]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((s, i) => (
                <tr
                  key={`${s.workerId}-${s.screeningId}-${i}`}
                  className="border-b border-[var(--border)] last:border-0"
                >
                  <td className="px-3 py-2">
                    <div className="font-medium text-white/90">
                      {s.workerName}
                    </div>
                    <div className="text-[10px] text-[var(--muted)]">
                      {s.workerEmail}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-[var(--muted)]">
                    {s.screeningTitle}
                  </td>
                  <td className="px-3 py-2 font-mono tabular-nums text-white/80">
                    {s.score}
                  </td>
                  <td className="px-3 py-2 font-mono tabular-nums text-[var(--muted)]">
                    {s.autoScore ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                        s.submissionStatus === "approved"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : s.submissionStatus === "rejected"
                            ? "bg-red-500/15 text-red-400"
                            : "bg-amber-500/15 text-amber-400"
                      }`}
                    >
                      {s.submissionStatus}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[var(--muted)]">
                    {new Date(s.completedAt).toLocaleDateString()}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => onSelect(s)}
                      className="rounded bg-blue-500/15 px-2 py-1 text-[10px] font-medium text-blue-400 hover:bg-blue-500/25"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ScreeningDetailPanel({
  screening,
  onClose,
}: {
  screening: Screening;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
      <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg)] p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">{screening.title}</h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-[var(--muted)] hover:bg-white/10 hover:text-white"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </button>
        </div>
        <div className="mt-2 text-xs text-[var(--muted)]">
          {screening.category} / {screening.screeningType} /{" "}
          {screening.evaluationMode}
        </div>
        {screening.description && (
          <p className="mt-2 text-xs text-[var(--muted)]">
            {screening.description}
          </p>
        )}
        <div className="mt-3 flex gap-4 text-xs text-[var(--muted)]">
          <span>Pass: {screening.passingScore}%</span>
          <span>Threshold: {screening.passThreshold}%</span>
          <span>Time: {screening.timeLimit}min</span>
          <span>
            Min justification: {screening.minJustificationWords} words
          </span>
        </div>

        {/* Questions */}
        <div className="mt-4">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            Questions ({screening.questions?.length ?? 0})
          </div>
          <div className="flex flex-col gap-2">
            {(screening.questions ?? []).map((q, i) => (
              <div
                key={q._id || i}
                className="rounded border border-[var(--border)] bg-black/20 p-3"
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs font-medium text-white/90">
                    Q{i + 1}: {q.question}
                  </span>
                  <span className="rounded bg-purple-500/15 px-1.5 py-0.5 text-[10px] text-purple-400">
                    {q.type}
                  </span>
                </div>
                {q.options && q.options.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {q.options.map((o, oi) => (
                      <span
                        key={oi}
                        className={`rounded px-1.5 py-0.5 text-[10px] ${
                          o === q.correctAnswer
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-gray-500/10 text-[var(--muted)]"
                        }`}
                      >
                        {o}
                      </span>
                    ))}
                  </div>
                )}
                <div className="mt-1 text-[10px] text-[var(--muted)]">
                  Points: {q.points ?? 1}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rubric */}
        {screening.rubric && screening.rubric.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
              Rubric
            </div>
            <div className="overflow-x-auto rounded border border-[var(--border)]">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--panel)]">
                    <th className="px-3 py-1.5 text-left text-[var(--muted)]">
                      Criteria
                    </th>
                    <th className="px-3 py-1.5 text-left text-[var(--muted)]">
                      Weight
                    </th>
                    <th className="px-3 py-1.5 text-left text-[var(--muted)]">
                      Max Score
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {screening.rubric.map((r, i) => (
                    <tr
                      key={i}
                      className="border-b border-[var(--border)] last:border-0"
                    >
                      <td className="px-3 py-1.5 text-white/80">
                        {r.criteria}
                      </td>
                      <td className="px-3 py-1.5 font-mono tabular-nums text-[var(--muted)]">
                        {r.weight}
                      </td>
                      <td className="px-3 py-1.5 font-mono tabular-nums text-[var(--muted)]">
                        {r.maxScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-4 font-mono text-[9px] text-[var(--muted)] opacity-50">
          ID: {screening._id}
        </div>
      </div>
    </div>
  );
}

function SubmissionInspector({
  submission,
  onClose,
  onReview,
  reviewing,
}: {
  submission: SubmissionEntry;
  onClose: () => void;
  onReview: (
    action: "approve" | "reject",
    adminScore?: number,
    rubricBreakdown?: Array<{
      criteria: string;
      weight: number;
      maxScore: number;
      awarded: number;
    }>,
  ) => void;
  reviewing: boolean;
}) {
  const [adminScore, setAdminScore] = useState<string>(
    submission.adminScore?.toString() ?? "",
  );
  const [rubricAwarded, setRubricAwarded] = useState<Record<number, number>>(
    () => {
      const map: Record<number, number> = {};
      submission.rubricBreakdown?.forEach((r, i) => (map[i] = r.awarded));
      return map;
    },
  );

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
      <div className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg)] p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Submission Review</h3>
            <span className="text-xs text-[var(--muted)]">
              {submission.workerName} — {submission.screeningTitle}
            </span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-[var(--muted)] hover:bg-white/10 hover:text-white"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </button>
        </div>

        {/* Meta */}
        <div className="mt-3 grid grid-cols-4 gap-3">
          {[
            { label: "Score", value: submission.score },
            { label: "Auto Score", value: submission.autoScore ?? "—" },
            { label: "Auto Pass", value: submission.autoPass ? "Yes" : "No" },
            {
              label: "Pass Threshold",
              value: `${submission.passThreshold ?? 70}%`,
            },
          ].map((m) => (
            <div
              key={m.label}
              className="rounded border border-[var(--border)] bg-black/20 px-3 py-2"
            >
              <div className="text-sm font-bold tabular-nums text-white/80">
                {m.value}
              </div>
              <div className="text-[10px] text-[var(--muted)]">{m.label}</div>
            </div>
          ))}
        </div>

        {/* Validation Flags */}
        {submission.validationFlags &&
          submission.validationFlags.length > 0 && (
            <div className="mt-4">
              <div className="mb-1 text-[10px] font-semibold uppercase text-[var(--muted)]">
                Validation Flags
              </div>
              <div className="flex flex-col gap-1">
                {submission.validationFlags.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span
                      className={f.passed ? "text-emerald-400" : "text-red-400"}
                    >
                      {f.passed ? "PASS" : "FAIL"}
                    </span>
                    <span className="text-white/80">{f.rule}</span>
                    <span className="text-[var(--muted)]">{f.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        {/* Answers / Questions */}
        {submission.screeningQuestions &&
          submission.screeningQuestions.length > 0 && (
            <div className="mt-4">
              <div className="mb-1 text-[10px] font-semibold uppercase text-[var(--muted)]">
                Answers
              </div>
              <div className="flex flex-col gap-2">
                {submission.screeningQuestions.map((q, i) => {
                  const ans = submission.answers as Record<
                    string,
                    unknown
                  > | null;
                  const ansValue = ans?.[String(i)] ?? ans?.[q.question] ?? "—";
                  return (
                    <div
                      key={i}
                      className="rounded border border-[var(--border)] bg-black/20 p-3"
                    >
                      <div className="text-xs font-medium text-white/90">
                        Q{i + 1} ({q.type}): {q.question}
                      </div>
                      <div className="mt-1.5 whitespace-pre-wrap text-xs text-[var(--muted)]">
                        Answer:{" "}
                        {typeof ansValue === "object"
                          ? JSON.stringify(ansValue, null, 2)
                          : String(ansValue)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        {/* Rubric scoring */}
        {submission.rubricTemplate && submission.rubricTemplate.length > 0 && (
          <div className="mt-4">
            <div className="mb-1 text-[10px] font-semibold uppercase text-[var(--muted)]">
              Rubric Scoring
            </div>
            <div className="flex flex-col gap-2">
              {submission.rubricTemplate.map((r, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded border border-[var(--border)] bg-black/20 px-3 py-2"
                >
                  <span className="flex-1 text-xs text-white/80">
                    {r.criteria}
                  </span>
                  <span className="text-[10px] text-[var(--muted)]">
                    w:{r.weight}
                  </span>
                  <span className="text-[10px] text-[var(--muted)]">
                    max:{r.maxScore}
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={r.maxScore}
                    value={rubricAwarded[i] ?? 0}
                    onChange={(e) =>
                      setRubricAwarded((prev) => ({
                        ...prev,
                        [i]: Number(e.target.value),
                      }))
                    }
                    className="w-16 rounded border border-[var(--border)] bg-black/40 px-2 py-1 text-xs text-white"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Admin Score */}
        <div className="mt-4">
          <label className="mb-1 block text-[10px] font-semibold uppercase text-[var(--muted)]">
            Admin Score Override
          </label>
          <input
            type="number"
            value={adminScore}
            onChange={(e) => setAdminScore(e.target.value)}
            placeholder="Leave blank to use auto/rubric score"
            className="w-48 rounded border border-[var(--border)] bg-black/30 px-2.5 py-1.5 text-xs text-white placeholder:text-[var(--muted)]"
          />
        </div>

        {/* Action buttons */}
        <div className="mt-5 flex gap-3">
          <button
            onClick={() => {
              const rb =
                submission.rubricTemplate?.map((r, i) => ({
                  criteria: r.criteria,
                  weight: r.weight,
                  maxScore: r.maxScore,
                  awarded: rubricAwarded[i] ?? 0,
                })) ?? undefined;
              onReview(
                "approve",
                adminScore ? Number(adminScore) : undefined,
                rb,
              );
            }}
            disabled={reviewing}
            className="rounded bg-emerald-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
          >
            {reviewing ? "Processing..." : "Approve"}
          </button>
          <button
            onClick={() => onReview("reject")}
            disabled={reviewing}
            className="rounded bg-red-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
          >
            {reviewing ? "Processing..." : "Reject"}
          </button>
          <button
            onClick={onClose}
            className="rounded border border-[var(--border)] px-4 py-2 text-xs font-medium text-[var(--muted)] hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateScreeningModal({
  onClose,
  onCreate,
  creating,
}: {
  onClose: () => void;
  onCreate: (data: Record<string, unknown>) => void;
  creating: boolean;
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<ScreeningCategory>("microjobs");
  const [screeningType, setScreeningType] = useState<ScreeningType>("mcq");
  const [passingScore, setPassingScore] = useState("70");
  const [timeLimit, setTimeLimit] = useState("60");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState([
    {
      question: "",
      type: "single" as string,
      options: ["", ""],
      correctAnswer: "",
      points: 1,
    },
  ]);

  const addQuestion = () =>
    setQuestions((p) => [
      ...p,
      {
        question: "",
        type: "single",
        options: ["", ""],
        correctAnswer: "",
        points: 1,
      },
    ]);

  const updateQ = (i: number, field: string, val: unknown) =>
    setQuestions((p) =>
      p.map((q, qi) => (qi === i ? { ...q, [field]: val } : q)),
    );

  const handleSubmit = () => {
    if (!title || title.length < 3) return;
    if (questions.length === 0 || !questions[0].question) return;
    onCreate({
      title,
      category,
      screeningType,
      description,
      passingScore: Number(passingScore),
      timeLimit: Number(timeLimit),
      questions: questions.map((q) => ({
        question: q.question,
        type: q.type,
        options: q.options.filter(Boolean),
        correctAnswer: q.correctAnswer,
        points: q.points,
      })),
    });
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60">
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-[var(--border)] bg-[var(--bg)] p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Create Screening</h3>
          <button
            onClick={onClose}
            className="rounded p-1 text-[var(--muted)] hover:bg-white/10 hover:text-white"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M4 4l8 8M12 4l-8 8"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-[var(--muted)]">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border border-[var(--border)] bg-black/30 px-2.5 py-1.5 text-xs text-white"
              placeholder="Min 3 characters"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-[var(--muted)]">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ScreeningCategory)}
              className="w-full rounded border border-[var(--border)] bg-black/30 px-2.5 py-1.5 text-xs text-white"
            >
              {SCREENING_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-[var(--muted)]">
              Type
            </label>
            <select
              value={screeningType}
              onChange={(e) =>
                setScreeningType(e.target.value as ScreeningType)
              }
              className="w-full rounded border border-[var(--border)] bg-black/30 px-2.5 py-1.5 text-xs text-white"
            >
              {SCREENING_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-[var(--muted)]">
              Passing Score
            </label>
            <input
              type="number"
              value={passingScore}
              onChange={(e) => setPassingScore(e.target.value)}
              className="w-full rounded border border-[var(--border)] bg-black/30 px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase text-[var(--muted)]">
              Time Limit (min)
            </label>
            <input
              type="number"
              value={timeLimit}
              onChange={(e) => setTimeLimit(e.target.value)}
              className="w-full rounded border border-[var(--border)] bg-black/30 px-2.5 py-1.5 text-xs text-white"
            />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-[10px] font-semibold uppercase text-[var(--muted)]">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded border border-[var(--border)] bg-black/30 px-2.5 py-1.5 text-xs text-white"
            />
          </div>
        </div>

        {/* Questions builder */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase text-[var(--muted)]">
              Questions ({questions.length})
            </span>
            <button
              onClick={addQuestion}
              className="rounded bg-blue-500/15 px-2 py-1 text-[10px] font-medium text-blue-400 hover:bg-blue-500/25"
            >
              + Add Question
            </button>
          </div>
          <div className="flex flex-col gap-3">
            {questions.map((q, i) => (
              <div
                key={i}
                className="rounded border border-[var(--border)] bg-black/20 p-3"
              >
                <div className="flex gap-2">
                  <input
                    value={q.question}
                    onChange={(e) => updateQ(i, "question", e.target.value)}
                    placeholder={`Question ${i + 1} (min 5 chars)`}
                    className="flex-1 rounded border border-[var(--border)] bg-black/30 px-2 py-1 text-xs text-white"
                  />
                  <select
                    value={q.type}
                    onChange={(e) => updateQ(i, "type", e.target.value)}
                    className="w-32 rounded border border-[var(--border)] bg-black/30 px-2 py-1 text-xs text-white"
                  >
                    {[
                      "single",
                      "multi",
                      "multiple_choice",
                      "text",
                      "written",
                      "ranking",
                      "red_team",
                      "fact_check",
                      "coding",
                      "multimodal",
                    ].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                {["single", "multi", "multiple_choice"].includes(q.type) && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {q.options.map((o, oi) => (
                      <input
                        key={oi}
                        value={o}
                        onChange={(e) => {
                          const newOpts = [...q.options];
                          newOpts[oi] = e.target.value;
                          updateQ(i, "options", newOpts);
                        }}
                        placeholder={`Option ${oi + 1}`}
                        className="w-28 rounded border border-[var(--border)] bg-black/30 px-2 py-1 text-[10px] text-white"
                      />
                    ))}
                    <button
                      onClick={() => updateQ(i, "options", [...q.options, ""])}
                      className="rounded bg-gray-500/15 px-2 py-1 text-[10px] text-[var(--muted)]"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={creating || !title || title.length < 3}
            className="rounded bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create Screening"}
          </button>
          <button
            onClick={onClose}
            className="rounded border border-[var(--border)] px-4 py-2 text-xs text-[var(--muted)] hover:text-white"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
