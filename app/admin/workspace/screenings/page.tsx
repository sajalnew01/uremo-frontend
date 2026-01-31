"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api";

/**
 * PATCH_44: Admin Screenings Management Page
 * Create and manage screening tests for job roles
 */

interface Screening {
  _id: string;
  title: string;
  description: string;
  category: string;
  questions: {
    question: string;
    options: string[];
    type?: "single" | "multi" | "multiple_choice" | "text" | "file_upload";
    correctAnswer?: number | string;
    correctAnswers?: string[];
  }[];
  passingScore: number;
  timeLimit: number;
  active?: boolean;
  isActive?: boolean;
  createdAt: string;
}

type ScreeningFormQuestion = {
  question: string;
  options: string[];
  type: "single" | "multi";
  correctAnswerIndexes: number[];
};

function ScreeningsContent() {
  const searchParams = useSearchParams();
  const showCreate = searchParams.get("action") === "create";

  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(showCreate);

  // Create form state
  const [form, setForm] = useState<{
    title: string;
    description: string;
    category: string;
    passingScore: number;
    timeLimit: number;
    questions: ScreeningFormQuestion[];
  }>({
    title: "",
    description: "",
    category: "microjobs",
    passingScore: 70,
    timeLimit: 30,
    questions: [
      {
        question: "",
        options: ["", "", "", ""],
        type: "single",
        correctAnswerIndexes: [0],
      },
    ],
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadScreenings();
  }, []);

  const loadScreenings = async () => {
    setLoading(true);
    try {
      const res = await apiRequest<any>(
        "/api/admin/workspace/screenings",
        "GET",
        null,
        true,
      );
      setScreenings(res.screenings || []);
    } catch (e: any) {
      setError(e.message || "Failed to load screenings");
    } finally {
      setLoading(false);
    }
  };

  const normalizeOptions = (options: string[]) =>
    options.map((o) => o.trim()).filter(Boolean);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    // Validate questions
    const validQuestions = form.questions.filter((q) => {
      const options = normalizeOptions(q.options);
      return q.question.trim() && options.length >= 2;
    });

    if (validQuestions.length === 0) {
      setError("Please add at least one question with at least 2 options");
      setCreating(false);
      return;
    }

    for (const q of validQuestions) {
      const options = normalizeOptions(q.options);
      const correctAnswers = q.correctAnswerIndexes
        .filter((idx) => options[idx])
        .map((idx) => options[idx]);

      if (correctAnswers.length === 0) {
        setError("Each question must have at least one correct answer");
        setCreating(false);
        return;
      }

      if (q.type === "single" && correctAnswers.length !== 1) {
        setError(
          "Single-choice questions must have exactly one correct answer",
        );
        setCreating(false);
        return;
      }
    }

    try {
      const payload = {
        ...form,
        questions: validQuestions.map((q) => {
          const options = normalizeOptions(q.options);
          const correctAnswers = q.correctAnswerIndexes
            .filter((idx) => options[idx])
            .map((idx) => options[idx]);
          return {
            question: q.question.trim(),
            type: q.type,
            options,
            correctAnswers,
          };
        }),
      };

      await apiRequest(
        "/api/admin/workspace/screenings",
        "POST",
        payload,
        true,
      );
      setSuccess("Screening created successfully!");
      setShowModal(false);
      setForm({
        title: "",
        description: "",
        category: "microjobs",
        passingScore: 70,
        timeLimit: 30,
        questions: [
          {
            question: "",
            options: ["", "", "", ""],
            type: "single",
            correctAnswerIndexes: [0],
          },
        ],
      });
      loadScreenings();
    } catch (e: any) {
      setError(e.message || "Failed to create screening");
    } finally {
      setCreating(false);
    }
  };

  const addQuestion = () => {
    setForm({
      ...form,
      questions: [
        ...form.questions,
        {
          question: "",
          options: ["", "", "", ""],
          type: "single",
          correctAnswerIndexes: [0],
        },
      ],
    });
  };

  const removeQuestion = (index: number) => {
    if (form.questions.length <= 1) return;
    setForm({
      ...form,
      questions: form.questions.filter((_, i) => i !== index),
    });
  };

  const updateQuestion = (
    index: number,
    field: string,
    value: string | number | string[] | number[],
  ) => {
    const updated = [...form.questions];
    updated[index] = {
      ...updated[index],
      [field]: value,
    } as ScreeningFormQuestion;
    setForm({ ...form, questions: updated });
  };

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...form.questions];
    updated[qIndex].options[oIndex] = value;
    setForm({ ...form, questions: updated });
  };

  const toggleCorrectAnswer = (qIndex: number, oIndex: number) => {
    const updated = [...form.questions];
    const q = updated[qIndex];
    if (q.type === "single") {
      q.correctAnswerIndexes = [oIndex];
    } else {
      if (q.correctAnswerIndexes.includes(oIndex)) {
        q.correctAnswerIndexes = q.correctAnswerIndexes.filter(
          (idx) => idx !== oIndex,
        );
      } else {
        q.correctAnswerIndexes = [...q.correctAnswerIndexes, oIndex];
      }
    }
    setForm({ ...form, questions: updated });
  };

  const handleDuplicate = async (id: string) => {
    try {
      await apiRequest(
        `/api/admin/workspace/screenings/${id}/clone`,
        "POST",
        null,
        true,
      );
      setSuccess("Screening duplicated successfully!");
      loadScreenings();
    } catch (e: any) {
      setError(e?.message || "Failed to duplicate screening");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this screening? This cannot be undone.")) {
      return;
    }
    try {
      await apiRequest(
        `/api/admin/workspace/screenings/${id}`,
        "DELETE",
        null,
        true,
      );
      setSuccess("Screening deleted successfully!");
      loadScreenings();
    } catch (e: any) {
      setError(e?.message || "Failed to delete screening");
    }
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
            <span className="text-3xl">📝</span>
            <div>
              <h1 className="text-2xl font-bold">Screenings</h1>
              <p className="text-slate-400 text-sm">
                Create and manage screening tests
              </p>
            </div>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + Create Screening
          </button>
        </div>
      </div>

      {/* Messages */}
      {success && (
        <div className="p-4 mb-6 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
          {success}
        </div>
      )}
      {error && (
        <div className="p-4 mb-6 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-slate-400">
          Loading screenings...
        </div>
      )}

      {/* Screenings List */}
      {!loading && screenings.length > 0 && (
        <div className="space-y-3">
          {screenings.map((screening) => (
            <div
              key={screening._id}
              className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">
                      {screening.title}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        (screening.active ?? screening.isActive)
                          ? "bg-emerald-500/20 text-emerald-400"
                          : "bg-slate-500/20 text-slate-400"
                      }`}
                    >
                      {(screening.active ?? screening.isActive)
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-2">
                    {screening.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                    <span>📚 {screening.questions?.length || 0} questions</span>
                    <span>⏱ {screening.timeLimit} min</span>
                    <span>🎯 {screening.passingScore}% to pass</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <Link
                    href={`/admin/workspace/screenings/${screening._id}`}
                    className="btn-secondary text-sm text-center"
                  >
                    View / Edit
                  </Link>
                  <button
                    onClick={() => handleDuplicate(screening._id)}
                    className="btn-secondary text-sm"
                  >
                    Duplicate
                  </button>
                  <button
                    onClick={() => handleDelete(screening._id)}
                    className="px-3 py-1 rounded-lg bg-red-500/20 text-red-300 text-sm hover:bg-red-500/30"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && screenings.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400 mb-4">No screenings created yet.</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Create Your First Screening
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-2xl border border-white/10 my-8">
            <h2 className="text-xl font-bold mb-4">Create Screening</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm text-slate-400 mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) =>
                      setForm({ ...form, title: e.target.value })
                    }
                    className="input w-full"
                    placeholder="e.g., Data Entry Skills Test"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm text-slate-400 mb-1">
                    Description
                  </label>
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    className="input w-full h-20 resize-none"
                    placeholder="Brief description of this screening test"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="input w-full"
                  >
                    <option value="microjobs">Microjobs</option>
                    <option value="writing">Writing</option>
                    <option value="teaching">Teaching</option>
                    <option value="coding_math">Coding & Math</option>
                    <option value="outlier">Outlier</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Passing Score (%)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={form.passingScore}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        passingScore: parseInt(e.target.value),
                      })
                    }
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Time Limit (minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.timeLimit}
                    onChange={(e) =>
                      setForm({ ...form, timeLimit: parseInt(e.target.value) })
                    }
                    className="input w-full"
                  />
                </div>
              </div>

              {/* Questions */}
              <div className="border-t border-white/10 pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">Questions</h3>
                  <button
                    type="button"
                    onClick={addQuestion}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    + Add Question
                  </button>
                </div>

                <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                  {form.questions.map((q, qIndex) => (
                    <div
                      key={qIndex}
                      className="p-4 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <span className="text-xs text-slate-500 shrink-0">
                          Q{qIndex + 1}
                        </span>
                        {form.questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeQuestion(qIndex)}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) =>
                            updateQuestion(qIndex, "question", e.target.value)
                          }
                          className="input w-full md:col-span-2"
                          placeholder="Enter question..."
                        />
                        <select
                          value={q.type}
                          onChange={(e) => {
                            const nextType = e.target.value as
                              | "single"
                              | "multi";
                            const updated = [...form.questions];
                            updated[qIndex].type = nextType;
                            if (
                              nextType === "single" &&
                              updated[qIndex].correctAnswerIndexes.length > 1
                            ) {
                              updated[qIndex].correctAnswerIndexes = [
                                updated[qIndex].correctAnswerIndexes[0],
                              ];
                            }
                            setForm({ ...form, questions: updated });
                          }}
                          className="input w-full"
                        >
                          <option value="single">Single Correct</option>
                          <option value="multi">Multi Correct</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {q.options.map((opt, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-2">
                            {q.type === "single" ? (
                              <input
                                type="radio"
                                name={`correct-${qIndex}`}
                                checked={q.correctAnswerIndexes.includes(
                                  oIndex,
                                )}
                                onChange={() =>
                                  toggleCorrectAnswer(qIndex, oIndex)
                                }
                                className="shrink-0"
                              />
                            ) : (
                              <input
                                type="checkbox"
                                checked={q.correctAnswerIndexes.includes(
                                  oIndex,
                                )}
                                onChange={() =>
                                  toggleCorrectAnswer(qIndex, oIndex)
                                }
                                className="shrink-0"
                              />
                            )}
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) =>
                                updateOption(qIndex, oIndex, e.target.value)
                              }
                              className="input w-full text-sm"
                              placeholder={`Option ${oIndex + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        {q.type === "single"
                          ? "Select the radio for the correct answer"
                          : "Select all correct answers"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary flex-1"
                >
                  {creating ? "Creating..." : "Create Screening"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminScreeningsPage() {
  return (
    <Suspense
      fallback={
        <div className="u-container max-w-6xl text-center py-12">
          Loading...
        </div>
      }
    >
      <ScreeningsContent />
    </Suspense>
  );
}
