"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { Badge, ConfirmModal } from "@/design-system";
import { emitToast } from "@/hooks/useToast";
import type { Screening } from "@/types";

export default function ScreeningDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showSubmit, setShowSubmit] = useState(false);

  const { data, isLoading } = useQuery<{ screening: Screening }>({
    queryKey: ["ws-screening", id],
    queryFn: () => apiRequest(EP.WORKSPACE_SCREENING(id), "GET", undefined, true),
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      apiRequest(EP.WORKSPACE_SCREENING_SUBMIT(id), "POST", { answers }, true),
    onSuccess: () => {
      emitToast("Screening submitted!", "success");
      router.push("/workspace/screenings");
    },
    onError: (err: Error) => emitToast(err.message, "error"),
  });

  const screening = data?.screening;

  if (isLoading) {
    return <div className="page-loading"><div className="u-spinner" /> Loading...</div>;
  }

  if (!screening) {
    return <div className="page-empty">Screening not found.</div>;
  }

  const allAnswered = screening.questions?.every((q) => answers[q._id]?.trim());

  return (
    <div style={{ maxWidth: 800 }}>
      <h1 className="page-title" style={{ marginBottom: "var(--space-2)" }}>{screening.title}</h1>
      <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-6)" }}>
        <Badge status={screening.screeningType} />
        <Badge status={screening.category} size="sm" />
        <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-tertiary)" }}>
          {screening.questions?.length || 0} question(s)
        </span>
      </div>

      {screening.rubric && (
        <div className="u-panel" style={{ marginBottom: "var(--space-6)" }}>
          <h4 style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", marginBottom: "var(--space-2)" }}>Instructions</h4>
          <p style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", whiteSpace: "pre-wrap" }}>{screening.rubric}</p>
        </div>
      )}

      {/* Questions */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
        {screening.questions?.map((q, i) => (
          <div key={q._id} className="u-card">
            <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
              <span style={{ fontWeight: "var(--weight-bold)", color: "var(--color-brand)" }}>Q{i + 1}</span>
              <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-medium)" }}>{q.questionText}</span>
            </div>

            {q.questionType === "mcq" && q.options ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                {q.options.map((opt, j) => (
                  <label
                    key={j}
                    className="u-panel"
                    style={{
                      display: "flex", alignItems: "center", gap: "var(--space-3)", cursor: "pointer",
                      borderColor: answers[q._id] === opt.text ? "var(--color-brand)" : undefined,
                    }}
                  >
                    <input
                      type="radio"
                      name={q._id}
                      value={opt.text}
                      checked={answers[q._id] === opt.text}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q._id]: opt.text }))}
                    />
                    <span style={{ fontSize: "var(--text-sm)" }}>{opt.text}</span>
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                className="u-input"
                rows={4}
                placeholder="Write your answer..."
                value={answers[q._id] || ""}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q._id]: e.target.value }))}
              />
            )}
          </div>
        ))}
      </div>

      {/* Submit */}
      <div style={{ marginTop: "var(--space-6)", display: "flex", gap: "var(--space-3)" }}>
        <button
          className="u-btn u-btn-primary u-btn-lg"
          disabled={!allAnswered}
          onClick={() => setShowSubmit(true)}
        >
          Submit Screening
        </button>
        <button className="u-btn u-btn-ghost" onClick={() => router.back()}>
          Cancel
        </button>
      </div>

      <ConfirmModal
        open={showSubmit}
        title="Submit Screening"
        message="Are you sure you want to submit? You cannot change your answers after submission."
        onConfirm={() => submitMutation.mutateAsync()}
        onCancel={() => setShowSubmit(false)}
      />
    </div>
  );
}
