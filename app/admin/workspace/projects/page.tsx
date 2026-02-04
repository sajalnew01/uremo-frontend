"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api";

/**
 * PATCH_44: Admin Projects Management Page
 * Create, view, assign, and manage work projects
 */

interface Project {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  assignedTo?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  earnings: number;
  earningsCredited?: number; // PATCH_48: Track if earnings were credited
  completionNotes?: string; // PATCH_48: Worker's completion notes
  deadline?: string;
  createdAt: string;
}

interface Worker {
  _id: string;
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  jobId: {
    title: string;
  };
  status: string;
}

function ProjectsContent() {
  const searchParams = useSearchParams();
  const showCreate = searchParams.get("action") === "create";

  const [projects, setProjects] = useState<Project[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(showCreate);
  const [filter, setFilter] = useState<string>("all");

  // Create form state
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "microjobs",
    priority: "medium",
    earnings: 0,
    deadline: "",
  });
  const [creating, setCreating] = useState(false);

  // Assign modal state
  const [assignModal, setAssignModal] = useState<Project | null>(null);
  const [selectedWorker, setSelectedWorker] = useState<string>("");

  // PATCH_57: Filter workers by category when assigning
  const [assignableWorkers, setAssignableWorkers] = useState<Worker[]>([]);

  // PATCH_48: Credit earnings modal state
  const [creditModal, setCreditModal] = useState<Project | null>(null);
  const [creditAmount, setCreditAmount] = useState<number>(0);
  const [creditRating, setCreditRating] = useState<number>(5);
  const [crediting, setCrediting] = useState(false);

  useEffect(() => {
    loadProjects();
    loadWorkers();
  }, [filter]);

  const loadProjects = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/workspace/projects`;
      if (filter !== "all") {
        url += `?status=${filter}`;
      }
      const res = await apiRequest<any>(url, "GET", null, true);
      setProjects(res.projects || []);
    } catch (e: any) {
      setError(e.message || "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const loadWorkers = async () => {
    try {
      // PATCH_57: Load workers who are ready to work (ready_to_work or assigned status)
      const res = await apiRequest<any>(
        "/api/admin/workspace/workers?limit=200",
        "GET",
        null,
        true,
      );
      // Filter to only workers who can receive tasks
      const allWorkers = res.workers || [];
      const readyWorkers = allWorkers.filter(
        (w: any) =>
          w.workerStatus === "ready_to_work" || w.workerStatus === "assigned",
      );
      setWorkers(readyWorkers);
    } catch (e) {
      console.error("Failed to load workers:", e);
    }
  };

  // PATCH_57: When assign modal opens, filter workers by project category
  useEffect(() => {
    if (assignModal) {
      const projectCategory = assignModal.category
        ?.toLowerCase()
        .replace(/[_-]/g, " ");
      // Filter workers whose job category matches project category
      // Also show all workers if no exact match (fallback)
      const filtered = workers.filter((w: any) => {
        const workerCategory = (w.category || w.jobId?.category || "")
          .toLowerCase()
          .replace(/[_-]/g, " ");
        // Match if categories are similar or if project category is generic
        return (
          workerCategory.includes(projectCategory) ||
          projectCategory.includes(workerCategory) ||
          projectCategory === "microjobs" ||
          projectCategory === "other"
        );
      });
      setAssignableWorkers(filtered.length > 0 ? filtered : workers);
    } else {
      setAssignableWorkers([]);
    }
  }, [assignModal, workers]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError(null);

    try {
      await apiRequest("/api/admin/workspace/projects", "POST", form, true);
      setSuccess("Project created successfully!");
      setShowModal(false);
      setForm({
        title: "",
        description: "",
        category: "microjobs",
        priority: "medium",
        earnings: 0,
        deadline: "",
      });
      loadProjects();
    } catch (e: any) {
      setError(e.message || "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const handleAssign = async () => {
    if (!assignModal || !selectedWorker) return;

    try {
      await apiRequest(
        `/api/admin/workspace/project/${assignModal._id}/assign`,
        "PUT",
        { workerId: selectedWorker },
        true,
      );
      setSuccess("Project assigned successfully!");
      setAssignModal(null);
      setSelectedWorker("");
      loadProjects();
    } catch (e: any) {
      setError(e.message || "Failed to assign project");
    }
  };

  // PATCH_48: Handle credit earnings
  const handleCreditEarnings = async () => {
    if (!creditModal || creditAmount <= 0) return;

    setCrediting(true);
    try {
      await apiRequest(
        `/api/admin/workspace/project/${creditModal._id}/credit`,
        "PUT",
        { amount: creditAmount, rating: creditRating },
        true,
      );
      setSuccess(`$${creditAmount.toFixed(2)} credited to worker!`);
      setCreditModal(null);
      setCreditAmount(0);
      setCreditRating(5);
      loadProjects();
    } catch (e: any) {
      setError(e.message || "Failed to credit earnings");
    } finally {
      setCrediting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-amber-500/20 text-amber-400",
      assigned: "bg-blue-500/20 text-blue-400",
      "in-progress": "bg-purple-500/20 text-purple-400",
      completed: "bg-emerald-500/20 text-emerald-400",
      cancelled: "bg-red-500/20 text-red-400",
    };
    return styles[status] || "bg-slate-500/20 text-slate-400";
  };

  const getPriorityBadge = (priority: string) => {
    const styles: Record<string, string> = {
      low: "text-slate-400",
      medium: "text-blue-400",
      high: "text-amber-400",
      urgent: "text-red-400",
    };
    return styles[priority] || "text-slate-400";
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
            <span className="text-3xl">📋</span>
            <div>
              <h1 className="text-2xl font-bold">Projects</h1>
              <p className="text-slate-400 text-sm">
                Create and manage work projects
              </p>
            </div>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            + Create Project
          </button>
        </div>
      </div>

      {/* PATCH_63: Contextual Guidance Banner for Projects */}
      {!loading && (
        <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 via-slate-800/50 to-blue-500/10 border border-cyan-500/20">
          <div className="flex items-start gap-3">
            <span className="text-2xl">📦</span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-white mb-1">
                Project Workflow:
              </h3>
              <ul className="text-sm text-slate-300 space-y-1">
                {projects.filter((p) => p.status === "pending" && !p.assignedTo)
                  .length > 0 && (
                  <li>
                    •{" "}
                    <span className="text-amber-400 font-medium">
                      {
                        projects.filter(
                          (p) => p.status === "pending" && !p.assignedTo,
                        ).length
                      }{" "}
                      unassigned project
                      {projects.filter(
                        (p) => p.status === "pending" && !p.assignedTo,
                      ).length > 1
                        ? "s"
                        : ""}
                    </span>{" "}
                    → Click "Assign" to give to a ready worker
                  </li>
                )}
                {projects.filter(
                  (p) => p.status === "in-progress" || p.status === "assigned",
                ).length > 0 && (
                  <li>
                    •{" "}
                    <span className="text-purple-400 font-medium">
                      {
                        projects.filter(
                          (p) =>
                            p.status === "in-progress" ||
                            p.status === "assigned",
                        ).length
                      }{" "}
                      project
                      {projects.filter(
                        (p) =>
                          p.status === "in-progress" || p.status === "assigned",
                      ).length > 1
                        ? "s"
                        : ""}{" "}
                      in progress
                    </span>{" "}
                    → Workers are completing the work
                  </li>
                )}
                {projects.filter(
                  (p) => p.status === "completed" && !p.earningsCredited,
                ).length > 0 && (
                  <li>
                    •{" "}
                    <span className="text-emerald-400 font-medium">
                      {
                        projects.filter(
                          (p) =>
                            p.status === "completed" && !p.earningsCredited,
                        ).length
                      }{" "}
                      completed
                    </span>{" "}
                    → Click "Credit Earnings" to pay the worker
                  </li>
                )}
                {projects.length === 0 && (
                  <li className="text-slate-400">
                    No projects yet. Click "+ Create Project" to get started.
                  </li>
                )}
              </ul>
              <p className="text-xs text-slate-500 mt-2">
                💡 Tip: Workers must be in "Ready to Work" status before they
                can be assigned projects.
                <Link
                  href="/admin/workforce"
                  className="text-cyan-400 hover:underline ml-1"
                >
                  Check Worker Pipeline →
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

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

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {["all", "pending", "assigned", "in-progress", "completed"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-white/5 text-slate-400 hover:bg-white/10"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1).replace("-", " ")}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12 text-slate-400">
          Loading projects...
        </div>
      )}

      {/* Projects List */}
      {!loading && projects.length > 0 && (
        <div className="space-y-3">
          {projects.map((project) => (
            <div
              key={project._id}
              className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-white">
                      {project.title}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${getStatusBadge(
                        project.status,
                      )}`}
                    >
                      {project.status}
                    </span>
                    <span
                      className={`text-xs ${getPriorityBadge(project.priority)}`}
                    >
                      ● {project.priority}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 line-clamp-2">
                    {project.description}
                  </p>
                  {project.assignedTo && (
                    <p className="text-xs text-slate-500 mt-2">
                      Assigned to: {project.assignedTo.firstName}{" "}
                      {project.assignedTo.lastName}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-medium text-emerald-400">
                      ${project.earnings?.toFixed(2) || "0.00"}
                    </p>
                    <p className="text-xs text-slate-500">Payout</p>
                  </div>
                  {project.status === "pending" && (
                    <button
                      onClick={() => setAssignModal(project)}
                      className="btn-secondary text-sm"
                    >
                      Assign
                    </button>
                  )}
                  {/* PATCH_48: Credit button for completed projects */}
                  {project.status === "completed" &&
                    !project.earningsCredited && (
                      <button
                        onClick={() => {
                          setCreditModal(project);
                          setCreditAmount(project.earnings || 0);
                        }}
                        className="btn-primary text-sm"
                      >
                        💰 Credit
                      </button>
                    )}
                  {project.status === "completed" &&
                    project.earningsCredited && (
                      <span className="text-xs text-emerald-400">
                        ✅ Credited
                      </span>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State - PATCH_63: Enhanced with helpful guidance */}
      {!loading && projects.length === 0 && (
        <div className="text-center py-12 card">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-white mb-2">
            No Projects Yet
          </h3>
          <p className="text-slate-400 mb-4 max-w-md mx-auto">
            Projects are work tasks that get assigned to qualified workers.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary mb-4"
          >
            + Create Your First Project
          </button>
          <div className="text-sm text-slate-500 space-y-1">
            <p>Before assigning projects, make sure you have:</p>
            <p>
              1.{" "}
              <Link
                href="/admin/work-positions"
                className="text-cyan-400 hover:underline"
              >
                Job Roles
              </Link>{" "}
              set up with screening
            </p>
            <p>
              2. Workers who passed screening in{" "}
              <Link
                href="/admin/workforce"
                className="text-cyan-400 hover:underline"
              >
                "Ready to Work"
              </Link>{" "}
              status
            </p>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-white/10">
            <h2 className="text-xl font-bold mb-4">Create Project</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input w-full"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">
                  Description
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="input w-full h-24 resize-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
                    <option value="data-entry">Data Entry</option>
                    <option value="content">Content</option>
                    <option value="research">Research</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Priority
                  </label>
                  <select
                    value={form.priority}
                    onChange={(e) =>
                      setForm({ ...form, priority: e.target.value })
                    }
                    className="input w-full"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Payout ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.earnings}
                    onChange={(e) =>
                      setForm({ ...form, earnings: parseFloat(e.target.value) })
                    }
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={form.deadline}
                    onChange={(e) =>
                      setForm({ ...form, deadline: e.target.value })
                    }
                    className="input w-full"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
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
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal - PATCH_57: Category-aware worker selection */}
      {assignModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-white/10">
            <h2 className="text-xl font-bold mb-2">Assign Project</h2>
            <p className="text-sm text-slate-400 mb-2">
              Assign &quot;{assignModal.title}&quot; to a worker
            </p>
            <p className="text-xs text-blue-400 mb-4">
              📁 Project Category: {assignModal.category}
            </p>

            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-1">
                Select Worker ({assignableWorkers.length} available)
              </label>
              {assignableWorkers.length === 0 ? (
                <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm">
                  ⚠️ No workers with &quot;ready_to_work&quot; status found.
                  Workers need to complete their screening first.
                </div>
              ) : (
                <select
                  value={selectedWorker}
                  onChange={(e) => setSelectedWorker(e.target.value)}
                  className="input w-full"
                >
                  <option value="">Choose a worker...</option>
                  {assignableWorkers.map((w: any) => (
                    <option key={w._id} value={w._id}>
                      {w.user?.name ||
                        `${w.userId?.firstName || ""} ${w.userId?.lastName || ""}`}{" "}
                      - {w.category || w.jobId?.title || "Unknown"}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setAssignModal(null);
                  setSelectedWorker("");
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                disabled={!selectedWorker || assignableWorkers.length === 0}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PATCH_48: Credit Earnings Modal */}
      {creditModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-6 w-full max-w-md border border-white/10">
            <h2 className="text-xl font-bold mb-2">💰 Credit Earnings</h2>
            <p className="text-sm text-slate-400 mb-4">
              Credit earnings for &quot;{creditModal.title}&quot;
            </p>

            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-1">
                Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={creditAmount}
                onChange={(e) =>
                  setCreditAmount(parseFloat(e.target.value) || 0)
                }
                className="input w-full"
              />
              <p className="text-xs text-slate-500 mt-1">
                Default payout: ${creditModal.earnings?.toFixed(2) || "0.00"}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-1">
                Rating (1-5 stars)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setCreditRating(star)}
                    className={`text-2xl transition-transform hover:scale-110 ${
                      star <= creditRating
                        ? "grayscale-0"
                        : "grayscale opacity-30"
                    }`}
                  >
                    ⭐
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setCreditModal(null);
                  setCreditAmount(0);
                  setCreditRating(5);
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={handleCreditEarnings}
                disabled={crediting || creditAmount <= 0}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                {crediting
                  ? "Crediting..."
                  : `Credit $${creditAmount.toFixed(2)}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminProjectsPage() {
  return (
    <Suspense
      fallback={
        <div className="u-container max-w-6xl text-center py-12">
          Loading...
        </div>
      }
    >
      <ProjectsContent />
    </Suspense>
  );
}
