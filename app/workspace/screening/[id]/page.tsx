"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

/**
 * PATCH_47: Screening Test Page
 * Worker takes the screening test with timer and multiple choice questions
 */

type Question = {
  _id?: string;
  question: string;
  type?: string;
  options: string[];
  points: number;
};

type Screening = {
  _id: string;
  title: string;
  description?: string;
  timeLimit: number;
  passingScore: number;
  questions: Question[];
};

export default function ScreeningTestPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const screeningId = params?.id as string;
  const positionId = searchParams?.get("position") || "";

  const [screening, setScreening] = useState<Screening | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [answers, setAnswers] = useState<Record<number, string | string[]>>({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [started, setStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    message: string;
    attemptsRemaining: number;
    newStatus: string;
    // PATCH_90: Hybrid screening fields
    autoScore?: number;
    autoPass?: boolean;
    evaluationMode?: string;
    submissionStatus?: string;
    validationFlags?: { rule: string; passed: boolean; detail: string }[];
    rubricBreakdown?: {
      criteria: string;
      weight: number;
      maxScore: number;
      awarded: number;
    }[];
  } | null>(null);

  // Load screening
  useEffect(() => {
    const loadScreening = async () => {
      if (!screeningId) return;
      setLoading(true);
      try {
        const res = await apiRequest(
          `/api/workspace/screening/${screeningId}`,
          "GET",
          null,
          true,
        );
        setScreening(res.screening);
        setTimeRemaining(res.screening.timeLimit * 60); // Convert to seconds
      } catch (e: any) {
        setError(e?.message || "Failed to load screening");
      } finally {
        setLoading(false);
      }
    };
    loadScreening();
  }, [screeningId]);

  // Timer
  useEffect(() => {
    if (!started || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(); // Auto-submit when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [started, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (questionIdx: number, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionIdx]: answer }));
  };

  const toggleMultiAnswer = (questionIdx: number, answer: string) => {
    setAnswers((prev) => {
      const current = Array.isArray(prev[questionIdx])
        ? (prev[questionIdx] as string[])
        : [];
      if (current.includes(answer)) {
        return {
          ...prev,
          [questionIdx]: current.filter((a) => a !== answer),
        };
      }
      return { ...prev, [questionIdx]: [...current, answer] };
    });
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      // Convert answers object to array
      const answerArray =
        screening?.questions.map((_, idx) => answers[idx] || "") || [];

      const res = await apiRequest(
        `/api/workspace/screening/${screeningId}/submit`,
        "POST",
        { answers: answerArray, positionId },
        true,
      );

      setResult({
        score: res.score,
        passed: res.passed,
        message: res.message,
        attemptsRemaining: res.attemptsRemaining,
        newStatus: res.newStatus,
        // PATCH_90: Hybrid screening fields
        autoScore: res.autoScore,
        autoPass: res.autoPass,
        evaluationMode: res.evaluationMode,
        submissionStatus: res.submissionStatus,
        validationFlags: res.validationFlags,
        rubricBreakdown: res.rubricBreakdown,
      });

      // PATCH_90: Different toast for hybrid/manual pending review
      if (res.submissionStatus === "pending_review") {
        toast("Submission received — pending admin review", "info");
      } else if (res.passed) {
        toast("Congratulations! You passed!", "success");
      } else {
        toast(res.message, "error");
      }
    } catch (e: any) {
      toast(e?.message || "Failed to submit", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="u-container max-w-3xl">
        <div className="card animate-pulse">
          <div className="h-8 w-1/2 rounded bg-white/10 mb-4" />
          <div className="h-4 w-3/4 rounded bg-white/10" />
        </div>
      </div>
    );
  }

  if (error || !screening) {
    return (
      <div className="u-container max-w-3xl">
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-red-300 mb-2">
            Something went wrong
          </h2>
          <p className="text-slate-400 mb-6">
            {error || "Screening not found"}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30 transition"
            >
              🔄 Retry
            </button>
            <Link
              href="/workspace"
              className="px-4 py-2 bg-slate-500/20 text-slate-300 rounded-lg hover:bg-slate-500/30 transition"
            >
              ← Back to Workspace
            </Link>
            <Link
              href="/support"
              className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 transition"
            >
              📞 Contact Support
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Result screen
  if (result) {
    // PATCH_90: Determine display mode
    const isPendingReview = result.submissionStatus === "pending_review";
    const isHybridOrManual =
      result.evaluationMode === "hybrid" || result.evaluationMode === "manual";

    return (
      <div className="u-container max-w-3xl">
        <div className="card text-center py-12">
          {/* PATCH_90: Pending Review state for hybrid/manual */}
          {isPendingReview ? (
            <>
              <div className="text-6xl mb-4">⏳</div>
              <h1 className="text-2xl font-bold mb-2">Submission Received</h1>
              {result.autoScore !== undefined && (
                <p className="text-3xl font-bold text-cyan-400 mb-2">
                  Auto Score: {result.autoScore}%
                </p>
              )}
              <p className="text-slate-300 mb-4">
                {result.autoPass
                  ? "Auto criteria met — pending admin review for final approval."
                  : "Your submission is under review. An admin will evaluate your responses."}
              </p>

              {/* Validation Flags Summary */}
              {result.validationFlags && result.validationFlags.length > 0 && (
                <div className="mt-4 mb-4 text-left max-w-md mx-auto">
                  <h3 className="text-sm font-medium text-slate-400 mb-2">
                    Validation Checks:
                  </h3>
                  <div className="space-y-1">
                    {result.validationFlags.map((flag, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span
                          className={
                            flag.passed ? "text-emerald-400" : "text-amber-400"
                          }
                        >
                          {flag.passed ? "✓" : "⚠"}
                        </span>
                        <span className="text-slate-300">{flag.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rubric Breakdown Summary */}
              {result.rubricBreakdown && result.rubricBreakdown.length > 0 && (
                <div className="mt-4 mb-4 text-left max-w-md mx-auto">
                  <h3 className="text-sm font-medium text-slate-400 mb-2">
                    Rubric Breakdown:
                  </h3>
                  <div className="space-y-1">
                    {result.rubricBreakdown.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-slate-300">{item.criteria}</span>
                        <span className="text-cyan-400 font-medium">
                          {item.awarded}/{item.maxScore}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 p-3 mb-6 max-w-md mx-auto">
                <p className="text-sm text-cyan-300">
                  📋 Your test has been submitted for admin review. You&apos;ll
                  be notified once it&apos;s evaluated.
                </p>
              </div>

              <Link href="/workspace" className="btn-primary">
                Back to Workspace
              </Link>
            </>
          ) : (
            <>
              {/* Original pass/fail display for auto-graded results */}
              <div className="text-6xl mb-4">{result.passed ? "🎉" : "😔"}</div>
              <h1 className="text-2xl font-bold mb-2">
                {result.passed ? "Congratulations!" : "Not Quite"}
              </h1>
              <p
                className={`text-4xl font-bold mb-4 ${result.passed ? "text-emerald-400" : "text-red-400"}`}
              >
                {result.score}%
              </p>
              <p className="text-slate-300 mb-6">{result.message}</p>

              {result.passed ? (
                <div className="space-y-4">
                  <p className="text-sm text-emerald-300">
                    You&apos;re now ready to receive work assignments!
                  </p>
                  <Link href="/workspace" className="btn-primary">
                    Go to Workspace
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {result.attemptsRemaining > 0 ? (
                    <>
                      <p className="text-sm text-amber-300">
                        You have {result.attemptsRemaining} attempt
                        {result.attemptsRemaining !== 1 ? "s" : ""} remaining.
                      </p>
                      <div className="flex gap-3 justify-center">
                        <Link href="/workspace" className="btn-secondary">
                          Review Training
                        </Link>
                        <button
                          onClick={() => {
                            setResult(null);
                            setAnswers({});
                            setCurrentQuestion(0);
                            setStarted(false);
                            setTimeRemaining(screening.timeLimit * 60);
                          }}
                          className="btn-primary"
                        >
                          Try Again
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-red-300">
                        You&apos;ve used all your attempts. Contact admin for
                        re-evaluation.
                      </p>
                      <Link href="/workspace" className="btn-secondary">
                        Back to Workspace
                      </Link>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  // Pre-start screen
  if (!started) {
    return (
      <div className="u-container max-w-3xl">
        <div className="card">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">📝</div>
            <h1 className="text-2xl font-bold">{screening.title}</h1>
            {screening.description && (
              <p className="text-slate-400 mt-2">{screening.description}</p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center p-4 rounded-xl bg-white/5">
              <p className="text-2xl font-bold text-blue-400">
                {screening.questions.length}
              </p>
              <p className="text-xs text-slate-400">Questions</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/5">
              <p className="text-2xl font-bold text-amber-400">
                {screening.timeLimit}
              </p>
              <p className="text-xs text-slate-400">Minutes</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-white/5">
              <p className="text-2xl font-bold text-emerald-400">
                {screening.passingScore}%
              </p>
              <p className="text-xs text-slate-400">Pass Score</p>
            </div>
          </div>

          <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 mb-6">
            <h3 className="font-medium text-amber-300 mb-2">⚠️ Important</h3>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>• Once started, the timer cannot be paused</li>
              <li>• Answer all questions before submitting</li>
              <li>• The test will auto-submit when time runs out</li>
              <li>• Make sure you have a stable internet connection</li>
            </ul>
          </div>

          <div className="flex gap-3 justify-center">
            <Link href="/workspace" className="btn-secondary">
              Go Back
            </Link>
            <button onClick={() => setStarted(true)} className="btn-primary">
              Start Test
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Test in progress
  const question = screening.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / screening.questions.length) * 100;
  const isLastQuestion = currentQuestion === screening.questions.length - 1;
  const allAnswered = screening.questions.every((q, idx) => {
    if (q.type === "multi") {
      return Array.isArray(answers[idx]) && (answers[idx] as string[]).length;
    }
    return answers[idx] !== undefined && answers[idx] !== "";
  });

  return (
    <div className="u-container max-w-3xl">
      {/* Header with timer */}
      <div className="card mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-bold">{screening.title}</h1>
            <p className="text-sm text-slate-400">
              Question {currentQuestion + 1} of {screening.questions.length}
            </p>
          </div>
          <div
            className={`text-2xl font-mono font-bold ${timeRemaining < 60 ? "text-red-400" : timeRemaining < 300 ? "text-amber-400" : "text-emerald-400"}`}
          >
            ⏱️ {formatTime(timeRemaining)}
          </div>
        </div>
        <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="card">
        <div className="mb-6">
          <span className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-sm mb-3">
            Question {currentQuestion + 1}
          </span>
          <h2 className="text-xl font-medium">{question.question}</h2>
        </div>

        {/* Options */}
        <div className="space-y-3 mb-8">
          {question.options.map((option, optIdx) => {
            const isMulti = question.type === "multi";
            const isSelected = isMulti
              ? Array.isArray(answers[currentQuestion]) &&
                (answers[currentQuestion] as string[]).includes(option)
              : answers[currentQuestion] === option;

            return (
              <button
                key={optIdx}
                onClick={() =>
                  isMulti
                    ? toggleMultiAnswer(currentQuestion, option)
                    : handleAnswer(currentQuestion, option)
                }
                className={`w-full text-left p-4 rounded-xl border transition ${
                  isSelected
                    ? "border-blue-500 bg-blue-500/20 text-white"
                    : "border-white/10 bg-white/5 hover:bg-white/10 text-slate-300"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      isSelected ? "bg-blue-500 text-white" : "bg-white/10"
                    }`}
                  >
                    {String.fromCharCode(65 + optIdx)}
                  </span>
                  <span>{option}</span>
                  {isMulti && (
                    <span className="ml-auto text-xs text-slate-400">
                      {isSelected ? "Selected" : "Tap to select"}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <button
            onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
            className="btn-secondary disabled:opacity-50"
          >
            ← Previous
          </button>

          <div className="flex gap-2">
            {screening.questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-8 h-8 rounded-full text-xs font-medium ${
                  idx === currentQuestion
                    ? "bg-blue-500 text-white"
                    : answers[idx] !== undefined
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-white/10 text-slate-400"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={!allAnswered || submitting}
              className="btn-primary disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Test"}
            </button>
          ) : (
            <button
              onClick={() =>
                setCurrentQuestion((prev) =>
                  Math.min(screening.questions.length - 1, prev + 1),
                )
              }
              className="btn-primary"
            >
              Next →
            </button>
          )}
        </div>

        {!allAnswered && isLastQuestion && (
          <p className="text-center text-amber-400 text-sm mt-4">
            ⚠️ Please answer all questions before submitting
          </p>
        )}
      </div>
    </div>
  );
}
