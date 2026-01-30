"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

/**
 * PATCH_47: Project Detail Page
 * Worker views project details and can submit completion
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
          <h3 className="font-medium mb-4">Submit Completion</h3>
          <p className="text-slate-400 text-sm mb-4">
            Once you've completed all the work, add your notes and submit for
            review.
          </p>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 block mb-1">
                Completion Notes
              </label>
              <textarea
                value={completionNotes}
                onChange={(e) => setCompletionNotes(e.target.value)}
                placeholder="Describe what you completed, any files submitted, links, etc..."
                rows={4}
                className="w-full bg-[#1f2937] border border-white/10 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <button
              onClick={submitProject}
              disabled={submitting || !completionNotes.trim()}
              className="btn-primary disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit for Review"}
            </button>
          </div>
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
