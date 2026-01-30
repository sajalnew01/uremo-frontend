"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

/**
 * PATCH_47: Project Detail Page
 * PATCH_48: Added Proof of Work submission
 * Worker views project details and can submit proof
 */

type Project = {
  _id: string;
  title: string;
  description?: string;
  instructions?: string;
  payRate: number;
  payType: "per_task" | "hourly" | "fixed";
  status: "assigned" | "in_progress" | "completed" | "cancelled";
  deadline?: string;
  assignedAt?: string;
  deliverables?: { title: string; description: string; required: boolean }[];
};

type Proof = {
  _id: string;
  status: "pending" | "approved" | "rejected";
  submissionText: string;
  attachments: { url: string; filename?: string }[];
  rejectionReason?: string;
  createdAt: string;
};

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();

  const projectId = params?.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // PATCH_48: Proof of work state
  const [proof, setProof] = useState<Proof | null>(null);
  const [proofText, setProofText] = useState("");
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [proofSubmitting, setProofSubmitting] = useState(false);

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;
      setLoading(true);
      try {
        const res = await apiRequest(
          `/api/workspace/project/${projectId}`,
          "GET",
          null,
          true,
        );
        setProject(res.project);

        // Load existing proof
        const proofRes = await apiRequest(
          `/api/workspace/project/${projectId}/proof`,
          "GET",
          null,
          true,
        );
        if (proofRes.proof) {
          setProof(proofRes.proof);
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load project");
      } finally {
        setLoading(false);
      }
    };
    loadProject();
  }, [projectId]);

  const startProject = async () => {
    try {
      await apiRequest(
        `/api/workspace/project/${projectId}/start`,
        "POST",
        null,
        true,
      );
      toast("Project started!", "success");
      // Reload
      const res = await apiRequest(
        `/api/workspace/project/${projectId}`,
        "GET",
        null,
        true,
      );
      setProject(res.project);
    } catch (e: any) {
      toast(e?.message || "Failed to start", "error");
    }
  };

  const submitProject = async () => {
    if (!completionNotes.trim()) {
      toast("Please add completion notes", "error");
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest(
        `/api/workspace/project/${projectId}/submit`,
        "POST",
        { completionNotes },
        true,
      );
      toast("Project submitted for review!", "success");
      router.push("/workspace/projects");
    } catch (e: any) {
      toast(e?.message || "Failed to submit", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // PATCH_48: Submit proof of work
  const submitProof = async () => {
    if (!proofText.trim()) {
      toast("Please describe your work", "error");
      return;
    }
    setProofSubmitting(true);
    try {
      // Upload files first if any
      const attachments: { url: string; filename: string }[] = [];
      for (const file of proofFiles) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await apiRequest(
          "/api/upload/chat",
          "POST",
          formData,
          true,
          true,
        );
        attachments.push({
          url: uploadRes.url,
          filename: file.name,
        });
      }

      await apiRequest(
        `/api/workspace/project/${projectId}/proof`,
        "POST",
        {
          submissionText: proofText,
          attachments,
        },
        true,
      );
      toast("Proof submitted successfully!", "success");

      // Reload proof
      const proofRes = await apiRequest(
        `/api/workspace/project/${projectId}/proof`,
        "GET",
        null,
        true,
      );
      setProof(proofRes.proof);
      setProofText("");
      setProofFiles([]);
    } catch (e: any) {
      toast(e?.message || "Failed to submit proof", "error");
    } finally {
      setProofSubmitting(false);
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

  if (error || !project) {
    return (
      <div className="u-container max-w-3xl">
        <div className="card text-center py-12">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-red-400 mb-4">{error || "Project not found"}</p>
          <Link href="/workspace/projects" className="btn-secondary">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    assigned: "bg-blue-500/20 text-blue-300",
    in_progress: "bg-amber-500/20 text-amber-300",
    completed: "bg-emerald-500/20 text-emerald-300",
    cancelled: "bg-red-500/20 text-red-300",
  };

  return (
    <div className="u-container max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/workspace/projects"
            className="text-sm text-slate-400 hover:text-white mb-2 inline-block"
          >
            ← Back to Projects
          </Link>
          <h1 className="text-2xl font-bold">{project.title}</h1>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm ${statusColors[project.status] || statusColors.assigned}`}
        >
          {project.status.replace("_", " ").toUpperCase()}
        </span>
      </div>

      {/* Project Info */}
      <div className="card">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 rounded-xl bg-white/5">
            <p className="text-xl font-bold text-emerald-400">
              ${project.payRate}
            </p>
            <p className="text-xs text-slate-400">
              {project.payType.replace("_", " ")}
            </p>
          </div>
          {project.deadline && (
            <div className="text-center p-3 rounded-xl bg-white/5">
              <p className="text-xl font-bold text-amber-400">
                {new Date(project.deadline).toLocaleDateString()}
              </p>
              <p className="text-xs text-slate-400">Deadline</p>
            </div>
          )}
          <div className="text-center p-3 rounded-xl bg-white/5">
            <p className="text-xl font-bold text-blue-400">
              {project.assignedAt
                ? new Date(project.assignedAt).toLocaleDateString()
                : "N/A"}
            </p>
            <p className="text-xs text-slate-400">Assigned</p>
          </div>
        </div>

        {project.description && (
          <div className="mb-6">
            <h3 className="font-medium mb-2">Description</h3>
            <p className="text-slate-300">{project.description}</p>
          </div>
        )}

        {project.instructions && (
          <div className="mb-6">
            <h3 className="font-medium mb-2">Instructions</h3>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-slate-300 whitespace-pre-wrap">
              {project.instructions}
            </div>
          </div>
        )}

        {project.deliverables && project.deliverables.length > 0 && (
          <div className="mb-6">
            <h3 className="font-medium mb-2">Deliverables</h3>
            <div className="space-y-2">
              {project.deliverables.map((d, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-white/5 border border-white/10"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={d.required ? "text-red-400" : "text-slate-400"}
                    >
                      {d.required ? "●" : "○"}
                    </span>
                    <span className="font-medium">{d.title}</span>
                    {d.required && (
                      <span className="text-xs text-red-400">(Required)</span>
                    )}
                  </div>
                  {d.description && (
                    <p className="text-sm text-slate-400 mt-1 ml-5">
                      {d.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {project.status === "assigned" && (
        <div className="card">
          <h3 className="font-medium mb-4">Ready to Start?</h3>
          <p className="text-slate-400 text-sm mb-4">
            Click the button below to mark this project as in progress.
          </p>
          <button onClick={startProject} className="btn-primary">
            Start Working on This Project
          </button>
        </div>
      )}

      {project.status === "in_progress" && (
        <div className="card">
          <h3 className="font-medium mb-4">📤 Submit Proof of Work</h3>

          {/* Existing proof status */}
          {proof && (
            <div
              className={`p-4 rounded-xl mb-4 border ${
                proof.status === "pending"
                  ? "bg-amber-500/10 border-amber-500/30"
                  : proof.status === "approved"
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-red-500/10 border-red-500/30"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Proof Status:</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    proof.status === "pending"
                      ? "bg-amber-500/20 text-amber-300"
                      : proof.status === "approved"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {proof.status.toUpperCase()}
                </span>
              </div>
              {proof.status === "rejected" && proof.rejectionReason && (
                <div className="mt-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-sm text-red-300">
                    <span className="font-medium">Rejection Reason:</span>{" "}
                    {proof.rejectionReason}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    You can resubmit your proof below.
                  </p>
                </div>
              )}
              {proof.status === "pending" && (
                <p className="text-sm text-slate-400">
                  Your proof is being reviewed by our team.
                </p>
              )}
            </div>
          )}

          {/* Submit form (show if no proof or rejected) */}
          {(!proof || proof.status === "rejected") && (
            <div className="space-y-4">
              <p className="text-slate-400 text-sm mb-4">
                Submit proof of your completed work including screenshots,
                links, or descriptions.
              </p>
              <div>
                <label className="text-sm text-slate-400 block mb-1">
                  Describe Your Work *
                </label>
                <textarea
                  value={proofText}
                  onChange={(e) => setProofText(e.target.value)}
                  placeholder="Describe what you completed, include links, explain the deliverables..."
                  rows={5}
                  className="w-full bg-[#1f2937] border border-white/10 rounded-lg px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 block mb-1">
                  Attachments (Screenshots, PDFs, etc.)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={(e) =>
                    setProofFiles(Array.from(e.target.files || []))
                  }
                  className="w-full bg-[#1f2937] border border-white/10 rounded-lg px-3 py-2 text-sm"
                />
                {proofFiles.length > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    {proofFiles.length} file(s) selected
                  </p>
                )}
              </div>
              <button
                onClick={submitProof}
                disabled={proofSubmitting || !proofText.trim()}
                className="btn-primary disabled:opacity-50"
              >
                {proofSubmitting ? "Submitting..." : "Submit Proof of Work"}
              </button>
            </div>
          )}
        </div>
      )}

      {project.status === "completed" && (
        <div className="card text-center py-8">
          <div className="text-4xl mb-4">🎉</div>
          <p className="text-emerald-400 font-medium">
            This project has been completed!
          </p>
          <p className="text-slate-400 text-sm mt-2">
            Earnings will be credited to your account.
          </p>
        </div>
      )}
    </div>
  );
}
