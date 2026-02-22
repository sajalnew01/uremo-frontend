"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";

import { apiRequest, ApiError } from "@/lib/api";
import { EP } from "@/lib/api/endpoints";
import { useRequireAuth } from "@/hooks/useAuth";

type TrainingMaterial = {
  title?: string;
  type?: "link" | "pdf" | "video";
  url?: string;
  description?: string;
};

type ScreeningQuestion = {
  _id?: string;
  question?: string;
  type?:
    | "single"
    | "multi"
    | "multiple_choice"
    | "text"
    | "file_upload"
    | "ranking"
    | "written"
    | "red_team"
    | "fact_check"
    | "coding"
    | "multimodal";
  options?: string[];
  points?: number;

  responseA?: string;
  responseB?: string;
  imageUrl?: string;
  codeLanguage?: string;
  referenceUrls?: string[];
  minWords?: number;
};

type ScreeningDoc = {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  screeningType?: string;
  timeLimit?: number;
  passingScore?: number;
  evaluationMode?: "manual" | "auto" | "hybrid";
  minJustificationWords?: number;
  trainingMaterials?: TrainingMaterial[];
  questions?: ScreeningQuestion[];
};

type GetScreeningResponse = { screening: ScreeningDoc };

type SubmitResponse = {
  success?: boolean;
  score?: number;
  autoScore?: number;
  autoPass?: boolean;
  evaluationMode?: string;
  submissionStatus?: string;
  passed?: boolean | null;
  attemptsUsed?: number;
  attemptsRemaining?: number;
  newStatus?: string;
  validationFlags?: Array<{ rule: string; passed: boolean; detail: string }>;
  rubricBreakdown?: Array<{
    criteria?: string;
    weight?: number;
    maxScore?: number;
    awarded?: number;
  }>;
  message?: string;
};

function initAnswer(q: ScreeningQuestion): unknown {
  const t = q.type || "single";
  if (t === "multi") return [] as string[];
  if (t === "ranking") return { choice: "", justification: "" };
  if (t === "fact_check")
    return { verdict: "", sourceUrl: "", explanation: "" };
  if (t === "red_team")
    return { prompt: "", expectedVulnerability: "", explanation: "" };
  if (t === "multimodal")
    return { description: "", issues: [] as string[], rating: 0 };
  return "";
}

export default function ScreeningRunner({
  screeningId,
  positionId,
}: {
  screeningId: string;
  positionId: string | null;
}) {
  const isAuthed = useRequireAuth();
  const [answers, setAnswers] = useState<unknown[]>([]);
  const [submitResult, setSubmitResult] = useState<SubmitResponse | null>(null);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  const screeningQuery = useQuery({
    queryKey: ["workspace", "screening", screeningId],
    queryFn: async () =>
      apiRequest<GetScreeningResponse>(
        EP.WORKSPACE_SCREENING(String(screeningId)),
        "GET",
        undefined,
        true,
      ),
    enabled: Boolean(isAuthed && screeningId),
  });

  const screening = screeningQuery.data?.screening;
  const questions = useMemo(() => screening?.questions || [], [screening]);

  useEffect(() => {
    if (!screening) return;
    setSubmitResult(null);
    setSubmitErr(null);
    setAnswers(questions.map((q) => initAnswer(q)));
  }, [screening, questions]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = { answers };
      if (positionId) payload.positionId = positionId;

      return apiRequest<SubmitResponse>(
        EP.WORKSPACE_SCREENING_SUBMIT(String(screeningId)),
        "POST",
        payload,
        true,
      );
    },
    onSuccess: (data) => {
      setSubmitResult(data);
      setSubmitErr(null);
    },
    onError: (e) => {
      if (e instanceof ApiError) {
        setSubmitErr(e.message);
      } else {
        setSubmitErr(
          e instanceof Error ? e.message : "Failed to submit screening",
        );
      }
      setSubmitResult(null);
    },
  });

  if (!isAuthed) return null;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold">Screening</div>
            <div className="mt-1 text-sm text-[var(--muted)]">
              {screeningId}
            </div>
          </div>
          <Link
            href="/workforce"
            className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-xs font-semibold"
          >
            Back
          </Link>
        </div>

        {positionId ? (
          <div className="mt-3 text-xs text-[var(--muted)]">
            Position context: {positionId}
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-5">
        {screeningQuery.isLoading ? (
          <div className="text-sm text-[var(--muted)]">
            Loading screening...
          </div>
        ) : screeningQuery.isError ? (
          <div className="text-sm text-[var(--muted)]">
            Failed to load screening.
          </div>
        ) : !screening ? (
          <div className="text-sm text-[var(--muted)]">
            Screening not found.
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="text-lg font-semibold tracking-tight">
                {screening.title}
              </div>
              <div className="mt-1 text-sm text-[var(--muted)]">
                {screening.description || "No description"}
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-2 py-1">
                  Mode: {screening.evaluationMode || "hybrid"}
                </span>
                <span className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-2 py-1">
                  Time limit: {screening.timeLimit ?? "—"}m
                </span>
                <span className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-2 py-1">
                  Passing: {screening.passingScore ?? "—"}%
                </span>
              </div>
            </div>

            {screening.trainingMaterials &&
            screening.trainingMaterials.length > 0 ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  Training Materials
                </div>
                <div className="mt-2 space-y-1">
                  {screening.trainingMaterials.map((m, idx) => (
                    <a
                      key={idx}
                      href={m.url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm hover:bg-[var(--panel-2)]"
                    >
                      <div className="font-semibold">
                        {m.title || "Material"}
                      </div>
                      <div className="text-xs text-[var(--muted)]">
                        {m.type || "link"}
                        {m.description ? ` · ${m.description}` : ""}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="space-y-3">
              {questions.map((q, idx) => {
                const qType = q.type || "single";
                const val = answers[idx];
                return (
                  <div
                    key={q._id || idx}
                    className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4"
                  >
                    <div className="text-sm font-semibold">Q{idx + 1}</div>
                    <div className="mt-1 text-sm text-[var(--muted)]">
                      {q.question || "—"}
                    </div>

                    {qType === "ranking" ? (
                      <div className="mt-3 space-y-3">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3">
                            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                              Response A
                            </div>
                            <div className="mt-2 whitespace-pre-wrap text-sm">
                              {q.responseA || "—"}
                            </div>
                          </div>
                          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3">
                            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                              Response B
                            </div>
                            <div className="mt-2 whitespace-pre-wrap text-sm">
                              {q.responseB || "—"}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          {(["A", "B"] as const).map((c) => (
                            <label
                              key={c}
                              className="flex items-center gap-2 text-sm"
                            >
                              <input
                                type="radio"
                                name={`rank-${idx}`}
                                checked={
                                  typeof val === "object" &&
                                  val !== null &&
                                  (val as { choice?: string }).choice === c
                                }
                                onChange={() => {
                                  setAnswers((prev) => {
                                    const next = [...prev];
                                    const cur =
                                      typeof next[idx] === "object" &&
                                      next[idx] !== null
                                        ? (next[idx] as Record<string, unknown>)
                                        : {};
                                    next[idx] = { ...cur, choice: c };
                                    return next;
                                  });
                                }}
                              />
                              Choose {c}
                            </label>
                          ))}
                        </div>

                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                            Justification
                          </div>
                          <textarea
                            value={
                              typeof val === "object" && val !== null
                                ? String(
                                    (val as { justification?: string })
                                      .justification || "",
                                  )
                                : ""
                            }
                            onChange={(e) => {
                              const text = e.target.value;
                              setAnswers((prev) => {
                                const next = [...prev];
                                const cur =
                                  typeof next[idx] === "object" &&
                                  next[idx] !== null
                                    ? (next[idx] as Record<string, unknown>)
                                    : {};
                                next[idx] = { ...cur, justification: text };
                                return next;
                              });
                            }}
                            rows={5}
                            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm"
                            placeholder={`Minimum words: ${q.minWords || screening.minJustificationWords || 30}`}
                          />
                        </div>
                      </div>
                    ) : qType === "fact_check" ? (
                      <div className="mt-3 space-y-3">
                        <div className="grid gap-2 sm:grid-cols-2">
                          <div>
                            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                              Verdict
                            </div>
                            <select
                              value={
                                typeof val === "object" && val !== null
                                  ? String(
                                      (val as { verdict?: string }).verdict ||
                                        "",
                                    )
                                  : ""
                              }
                              onChange={(e) => {
                                const verdict = e.target.value;
                                setAnswers((prev) => {
                                  const next = [...prev];
                                  const cur =
                                    typeof next[idx] === "object" &&
                                    next[idx] !== null
                                      ? (next[idx] as Record<string, unknown>)
                                      : {};
                                  next[idx] = { ...cur, verdict };
                                  return next;
                                });
                              }}
                              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm"
                            >
                              <option value="">Select</option>
                              <option value="true">true</option>
                              <option value="false">false</option>
                              <option value="misleading">misleading</option>
                              <option value="unverifiable">unverifiable</option>
                            </select>
                          </div>

                          <div>
                            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                              Source URL
                            </div>
                            <input
                              type="url"
                              value={
                                typeof val === "object" && val !== null
                                  ? String(
                                      (val as { sourceUrl?: string })
                                        .sourceUrl || "",
                                    )
                                  : ""
                              }
                              onChange={(e) => {
                                const sourceUrl = e.target.value;
                                setAnswers((prev) => {
                                  const next = [...prev];
                                  const cur =
                                    typeof next[idx] === "object" &&
                                    next[idx] !== null
                                      ? (next[idx] as Record<string, unknown>)
                                      : {};
                                  next[idx] = { ...cur, sourceUrl };
                                  return next;
                                });
                              }}
                              className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm"
                              placeholder="https://..."
                            />
                          </div>
                        </div>

                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                            Explanation
                          </div>
                          <textarea
                            value={
                              typeof val === "object" && val !== null
                                ? String(
                                    (val as { explanation?: string })
                                      .explanation || "",
                                  )
                                : ""
                            }
                            onChange={(e) => {
                              const explanation = e.target.value;
                              setAnswers((prev) => {
                                const next = [...prev];
                                const cur =
                                  typeof next[idx] === "object" &&
                                  next[idx] !== null
                                    ? (next[idx] as Record<string, unknown>)
                                    : {};
                                next[idx] = { ...cur, explanation };
                                return next;
                              });
                            }}
                            rows={5}
                            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm"
                            placeholder="Explain your reasoning..."
                          />
                        </div>
                      </div>
                    ) : qType === "red_team" ? (
                      <div className="mt-3 space-y-3">
                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                            Adversarial Prompt
                          </div>
                          <textarea
                            value={
                              typeof val === "object" && val !== null
                                ? String(
                                    (val as { prompt?: string }).prompt || "",
                                  )
                                : ""
                            }
                            onChange={(e) => {
                              const prompt = e.target.value;
                              setAnswers((prev) => {
                                const next = [...prev];
                                const cur =
                                  typeof next[idx] === "object" &&
                                  next[idx] !== null
                                    ? (next[idx] as Record<string, unknown>)
                                    : {};
                                next[idx] = { ...cur, prompt };
                                return next;
                              });
                            }}
                            rows={4}
                            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm"
                          />
                        </div>

                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                            Expected Vulnerability
                          </div>
                          <input
                            value={
                              typeof val === "object" && val !== null
                                ? String(
                                    (val as { expectedVulnerability?: string })
                                      .expectedVulnerability || "",
                                  )
                                : ""
                            }
                            onChange={(e) => {
                              const expectedVulnerability = e.target.value;
                              setAnswers((prev) => {
                                const next = [...prev];
                                const cur =
                                  typeof next[idx] === "object" &&
                                  next[idx] !== null
                                    ? (next[idx] as Record<string, unknown>)
                                    : {};
                                next[idx] = { ...cur, expectedVulnerability };
                                return next;
                              });
                            }}
                            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm"
                            placeholder="e.g. prompt injection, data exfiltration"
                          />
                        </div>

                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                            Explanation
                          </div>
                          <textarea
                            value={
                              typeof val === "object" && val !== null
                                ? String(
                                    (val as { explanation?: string })
                                      .explanation || "",
                                  )
                                : ""
                            }
                            onChange={(e) => {
                              const explanation = e.target.value;
                              setAnswers((prev) => {
                                const next = [...prev];
                                const cur =
                                  typeof next[idx] === "object" &&
                                  next[idx] !== null
                                    ? (next[idx] as Record<string, unknown>)
                                    : {};
                                next[idx] = { ...cur, explanation };
                                return next;
                              });
                            }}
                            rows={5}
                            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    ) : qType === "multimodal" ? (
                      <div className="mt-3 space-y-3">
                        {q.imageUrl ? (
                          <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3">
                            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                              Image
                            </div>
                            <img
                              src={q.imageUrl}
                              alt="screening"
                              className="mt-2 max-h-64 w-full rounded-xl object-contain"
                            />
                          </div>
                        ) : null}

                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                            Description
                          </div>
                          <textarea
                            value={
                              typeof val === "object" && val !== null
                                ? String(
                                    (val as { description?: string })
                                      .description || "",
                                  )
                                : ""
                            }
                            onChange={(e) => {
                              const description = e.target.value;
                              setAnswers((prev) => {
                                const next = [...prev];
                                const cur =
                                  typeof next[idx] === "object" &&
                                  next[idx] !== null
                                    ? (next[idx] as Record<string, unknown>)
                                    : {};
                                next[idx] = { ...cur, description };
                                return next;
                              });
                            }}
                            rows={4}
                            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm"
                          />
                        </div>

                        <div>
                          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                            Rating (1-5)
                          </div>
                          <input
                            type="number"
                            min={1}
                            max={5}
                            value={
                              typeof val === "object" && val !== null
                                ? Number(
                                    (val as { rating?: number }).rating || 0,
                                  )
                                : 0
                            }
                            onChange={(e) => {
                              const rating = Number(e.target.value || 0);
                              setAnswers((prev) => {
                                const next = [...prev];
                                const cur =
                                  typeof next[idx] === "object" &&
                                  next[idx] !== null
                                    ? (next[idx] as Record<string, unknown>)
                                    : {};
                                next[idx] = { ...cur, rating };
                                return next;
                              });
                            }}
                            className="mt-2 w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm"
                          />
                        </div>
                      </div>
                    ) : qType === "multi" ? (
                      <div className="mt-3 space-y-2">
                        {(q.options || []).map((opt) => {
                          const selected =
                            Array.isArray(val) && val.includes(opt);
                          return (
                            <label
                              key={opt}
                              className="flex items-center gap-2 text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={() => {
                                  setAnswers((prev) => {
                                    const next = [...prev];
                                    const cur = Array.isArray(next[idx])
                                      ? (next[idx] as string[])
                                      : [];
                                    next[idx] = selected
                                      ? cur.filter((x) => x !== opt)
                                      : [...cur, opt];
                                    return next;
                                  });
                                }}
                              />
                              {opt}
                            </label>
                          );
                        })}
                        {!q.options || q.options.length === 0 ? (
                          <div className="text-sm text-[var(--muted)]">
                            No options configured.
                          </div>
                        ) : null}
                      </div>
                    ) : qType === "single" || qType === "multiple_choice" ? (
                      <div className="mt-3 space-y-2">
                        {(q.options || []).map((opt) => (
                          <label
                            key={opt}
                            className="flex items-center gap-2 text-sm"
                          >
                            <input
                              type="radio"
                              name={`q-${idx}`}
                              checked={String(val || "") === opt}
                              onChange={() => {
                                setAnswers((prev) => {
                                  const next = [...prev];
                                  next[idx] = opt;
                                  return next;
                                });
                              }}
                            />
                            {opt}
                          </label>
                        ))}
                        {!q.options || q.options.length === 0 ? (
                          <div className="text-sm text-[var(--muted)]">
                            No options configured.
                          </div>
                        ) : null}
                      </div>
                    ) : qType === "coding" ? (
                      <div className="mt-3 space-y-2">
                        {q.codeLanguage ? (
                          <div className="text-xs text-[var(--muted)]">
                            Language: {q.codeLanguage}
                          </div>
                        ) : null}
                        <textarea
                          value={typeof val === "string" ? val : ""}
                          onChange={(e) => {
                            const text = e.target.value;
                            setAnswers((prev) => {
                              const next = [...prev];
                              next[idx] = text;
                              return next;
                            });
                          }}
                          rows={8}
                          className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 font-mono text-sm"
                          placeholder="Paste your code here..."
                        />
                      </div>
                    ) : (
                      <div className="mt-3">
                        <textarea
                          value={typeof val === "string" ? val : ""}
                          onChange={(e) => {
                            const text = e.target.value;
                            setAnswers((prev) => {
                              const next = [...prev];
                              next[idx] = text;
                              return next;
                            });
                          }}
                          rows={6}
                          className="w-full rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm"
                          placeholder="Your answer..."
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              {questions.length === 0 ? (
                <div className="text-sm text-[var(--muted)]">
                  No questions configured.
                </div>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={submitMutation.isPending || questions.length === 0}
                onClick={() => {
                  setSubmitErr(null);
                  setSubmitResult(null);
                  submitMutation.mutate();
                }}
                className="rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-xs font-semibold disabled:opacity-50"
              >
                {submitMutation.isPending
                  ? "Submitting..."
                  : "Submit Screening"}
              </button>

              <div className="text-xs text-[var(--muted)]">
                Answers are submitted as an ordered array matching questions.
              </div>
            </div>

            {submitErr ? (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm">
                {submitErr}
              </div>
            ) : null}

            {submitResult ? (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                <div className="text-sm font-semibold">Submission Result</div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm">
                    Score:{" "}
                    <span className="font-semibold">
                      {submitResult.score ?? "—"}%
                    </span>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm">
                    Status:{" "}
                    <span className="font-semibold">
                      {submitResult.newStatus ?? "—"}
                    </span>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm">
                    Attempts remaining:{" "}
                    <span className="font-semibold">
                      {submitResult.attemptsRemaining ?? "—"}
                    </span>
                  </div>
                  <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-sm">
                    Review:{" "}
                    <span className="font-semibold">
                      {submitResult.submissionStatus ?? "—"}
                    </span>
                  </div>
                </div>

                {submitResult.message ? (
                  <div className="mt-3 text-sm text-[var(--muted)]">
                    {submitResult.message}
                  </div>
                ) : null}

                {submitResult.validationFlags &&
                submitResult.validationFlags.length > 0 ? (
                  <div className="mt-4">
                    <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                      Validation Flags
                    </div>
                    <div className="mt-2 space-y-1">
                      {submitResult.validationFlags.map((f, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-xs"
                        >
                          <span className="font-semibold">
                            {f.passed ? "PASS" : "FAIL"}
                          </span>{" "}
                          · {f.rule} — {f.detail}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
