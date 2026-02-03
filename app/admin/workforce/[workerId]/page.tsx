"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";

/**
 * PATCH_61: Worker 360° Control Page
 *
 * THE SINGLE SOURCE OF TRUTH for a single worker.
 * All worker lifecycle actions accessible from ONE place.
 *
 * Tabs:
 * 1. Overview - Identity, status, quick stats
 * 2. Applications - All job applications for this user
 * 3. Screening - Test history, scores, attempts
 * 4. Projects - Assigned, active, and completed projects
 * 5. Proofs - Submitted proof of work
 * 6. Earnings - Total, pending, credited, withdrawal history
 * 7. Activity Log - Timeline of all worker events
 */

type TabType =
  | "overview"
  | "applications"
  | "screening"
  | "projects"
  | "proofs"
  | "earnings"
  | "activity";

// Status labels matching backend exactly
const STATUS_LABELS: Record<string, string> = {
  applied: "Applied",
  screening_unlocked: "Screening Unlocked",
  training_viewed: "Training Viewed",
  test_submitted: "Test Submitted",
  failed: "Failed Screening",
  ready_to_work: "Ready to Work",
  assigned: "Assigned",
  working: "Working",
  suspended: "Suspended",
  inactive: "Inactive",
  fresh: "Fresh",
  screening_available: "Screening Available",
};

const STATUS_COLORS: Record<string, string> = {
  applied: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  screening_unlocked: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  training_viewed: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  test_submitted: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  failed: "bg-red-500/20 text-red-300 border-red-500/30",
  ready_to_work: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  assigned: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  working: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  suspended: "bg-red-500/20 text-red-300 border-red-500/30",
  inactive: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  fresh: "bg-slate-500/20 text-slate-300 border-slate-500/30",
  screening_available: "bg-amber-500/20 text-amber-300 border-amber-500/30",
};

interface WorkerDetail {
  _id: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt?: string;
    phone?: string;
    avatar?: string;
  };
  position?: {
    _id: string;
    title: string;
    category?: string;
  };
  positionTitle?: string;
  category?: string;
  workerStatus: string;
  status: string;
  attemptCount: number;
  maxAttempts: number;
  totalEarnings: number;
  pendingEarnings: number;
  payRate: number;
  screeningsCompleted: Array<{
    screeningId: string;
    completedAt: string;
    score: number;
  }>;
  testsCompleted: Array<{
    testId: string;
    completedAt: string;
    score: number;
    passed: boolean;
  }>;
  projectsCompleted: Array<{
    projectId: string;
    completedAt: string;
    rating: number;
    earnings: number;
  }>;
  currentProject?: {
    _id: string;
    title: string;
    status: string;
  };
  adminNotes?: string;
  trainingViewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt?: string;
  resumeUrl?: string;
  message?: string;
}

interface ProjectData {
  _id: string;
  title: string;
  description?: string;
  category: string;
  status: string;
  payRate: number;
  payType: string;
  assignedAt?: string;
  completedAt?: string;
  earningsCredited?: number;
  creditedAt?: string;
  deadline?: string;
}

interface ProofData {
  _id: string;
  projectId: {
    _id: string;
    title: string;
  };
  submissionText: string;
  attachments: Array<{ url: string; filename?: string }>;
  status: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: { firstName: string; lastName: string };
  rejectionReason?: string;
}

interface ActivityEvent {
  _id: string;
  type: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export default function Worker360Page() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const workerId = params.workerId as string;

  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Data states
  const [worker, setWorker] = useState<WorkerDetail | null>(null);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [proofs, setProofs] = useState<ProofData[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [availableProjects, setAvailableProjects] = useState<ProjectData[]>([]);

  // Modal states
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null,
  );
  const [newStatus, setNewStatus] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [creditAmount, setCreditAmount] = useState(0);

  // Load worker data
  const loadWorkerData = useCallback(async () => {
    if (!workerId) return;

    setLoading(true);
    try {
      // Fetch all workers and find the specific one
      const workersRes = await apiRequest<any>(
        `/api/admin/workspace/workers?limit=500`,
        "GET",
        null,
        true,
      );

      const allWorkers = workersRes.workers || [];
      const workerData = allWorkers.find(
        (w: any) => w._id === workerId || w.user?._id === workerId,
      );

      if (!workerData) {
        toast("Worker not found", "error");
        router.push("/admin/workforce");
        return;
      }

      // Normalize the worker data
      const normalizedWorker: WorkerDetail = {
        _id: workerData._id,
        user: workerData.user || {
          _id: "",
          firstName: "",
          lastName: "",
          email: "",
        },
        position: workerData.position,
        positionTitle:
          workerData.positionTitle ||
          workerData.position?.title ||
          "No Position",
        category: workerData.category || workerData.position?.category || "",
        workerStatus: workerData.workerStatus || "applied",
        status: workerData.status || "pending",
        attemptCount: workerData.attemptCount || 0,
        maxAttempts: workerData.maxAttempts || 2,
        totalEarnings: workerData.totalEarnings || 0,
        pendingEarnings: workerData.pendingEarnings || 0,
        payRate: workerData.payRate || 0,
        screeningsCompleted: workerData.screeningsCompleted || [],
        testsCompleted: workerData.testsCompleted || [],
        projectsCompleted: workerData.projectsCompleted || [],
        currentProject: workerData.currentProject,
        adminNotes: workerData.adminNotes || "",
        trainingViewedAt: workerData.trainingViewedAt,
        approvedBy: workerData.approvedBy,
        approvedAt: workerData.approvedAt,
        createdAt: workerData.createdAt,
        updatedAt: workerData.updatedAt,
        resumeUrl: workerData.resumeUrl,
        message: workerData.message,
      };

      setWorker(normalizedWorker);
      setAdminNotes(normalizedWorker.adminNotes || "");

      // Fetch projects assigned to this worker's user
      if (normalizedWorker.user._id) {
        const projectsRes = await apiRequest<any>(
          `/api/admin/workspace/projects?limit=100`,
          "GET",
          null,
          true,
        );
        const workerProjects = (projectsRes.projects || []).filter(
          (p: any) =>
            p.assignedTo?._id === normalizedWorker.user._id ||
            p.assignedTo === normalizedWorker.user._id,
        );
        setProjects(workerProjects);

        // Fetch proofs for this worker
        const proofsRes = await apiRequest<any>(
          `/api/admin/proofs?limit=100`,
          "GET",
          null,
          true,
        );
        const workerProofs = (proofsRes.proofs || []).filter(
          (p: any) =>
            p.workerId?._id === normalizedWorker.user._id ||
            p.workerId === normalizedWorker.user._id,
        );
        setProofs(workerProofs);

        // Available projects for assignment
        const availableRes = await apiRequest<any>(
          `/api/admin/workspace/projects?status=pending`,
          "GET",
          null,
          true,
        );
        setAvailableProjects(
          (availableRes.projects || []).filter(
            (p: any) => !p.assignedTo && p.status === "pending",
          ),
        );
      }

      // Build activity timeline from available data
      const activityEvents: ActivityEvent[] = [];

      // Application created
      activityEvents.push({
        _id: `app-${normalizedWorker._id}`,
        type: "application_created",
        description: `Applied for ${normalizedWorker.positionTitle}`,
        timestamp: normalizedWorker.createdAt,
      });

      // Training viewed
      if (normalizedWorker.trainingViewedAt) {
        activityEvents.push({
          _id: `training-${normalizedWorker._id}`,
          type: "training_viewed",
          description: "Viewed training materials",
          timestamp: normalizedWorker.trainingViewedAt,
        });
      }

      // Screenings completed
      normalizedWorker.screeningsCompleted.forEach((s, i) => {
        activityEvents.push({
          _id: `screening-${i}`,
          type: "screening_completed",
          description: `Completed screening with score ${s.score}%`,
          timestamp: s.completedAt,
        });
      });

      // Tests completed
      normalizedWorker.testsCompleted.forEach((t, i) => {
        activityEvents.push({
          _id: `test-${i}`,
          type: t.passed ? "test_passed" : "test_failed",
          description: `${t.passed ? "Passed" : "Failed"} test with score ${t.score}%`,
          timestamp: t.completedAt,
        });
      });

      // Projects completed
      normalizedWorker.projectsCompleted.forEach((p, i) => {
        activityEvents.push({
          _id: `project-${i}`,
          type: "project_completed",
          description: `Completed project, earned $${p.earnings}`,
          timestamp: p.completedAt,
        });
      });

      // Sort by timestamp descending
      activityEvents.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      setActivities(activityEvents);
    } catch (error: any) {
      console.error("Error loading worker data:", error);
      toast(error.message || "Failed to load worker data", "error");
    } finally {
      setLoading(false);
    }
  }, [workerId, toast, router]);

  useEffect(() => {
    loadWorkerData();
  }, [loadWorkerData]);

  // Action handlers
  const handleStatusChange = async () => {
    if (!worker || !newStatus) return;

    setActionLoading("status");
    try {
      await apiRequest(
        `/api/admin/workspace/worker/${worker._id}/status`,
        "PUT",
        { workerStatus: newStatus },
        true,
      );
      toast(
        `Status updated to ${STATUS_LABELS[newStatus] || newStatus}`,
        "success",
      );
      setShowStatusModal(false);
      loadWorkerData();
    } catch (error: any) {
      toast(error.message || "Failed to update status", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignProject = async () => {
    if (!worker || !selectedProjectId) return;

    setActionLoading("assign");
    try {
      await apiRequest(
        `/api/admin/workspace/project/${selectedProjectId}/assign`,
        "PUT",
        { workerId: worker.user._id },
        true,
      );
      toast("Project assigned successfully", "success");
      setShowAssignModal(false);
      setSelectedProjectId(null);
      loadWorkerData();
    } catch (error: any) {
      toast(error.message || "Failed to assign project", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveProof = async (proofId: string, projectId: string) => {
    if (!worker) return;

    setActionLoading(`proof-${proofId}`);
    try {
      // Approve the proof
      await apiRequest(`/api/admin/proofs/${proofId}/approve`, "PUT", {}, true);

      // Credit the earnings
      const project = projects.find((p) => p._id === projectId);
      if (project && project.payRate > 0) {
        await apiRequest(
          `/api/admin/workspace/project/${projectId}/credit`,
          "PUT",
          { amount: project.payRate },
          true,
        );
      }

      toast("Proof approved and earnings credited", "success");
      loadWorkerData();
    } catch (error: any) {
      toast(error.message || "Failed to approve proof", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectProof = async (proofId: string, reason: string) => {
    setActionLoading(`proof-${proofId}`);
    try {
      await apiRequest(
        `/api/admin/proofs/${proofId}/reject`,
        "PUT",
        { reason },
        true,
      );
      toast("Proof rejected", "success");
      loadWorkerData();
    } catch (error: any) {
      toast(error.message || "Failed to reject proof", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleSaveNotes = async () => {
    if (!worker) return;

    setActionLoading("notes");
    try {
      await apiRequest(
        `/api/admin/workspace/worker/${worker._id}/status`,
        "PUT",
        { adminNotes },
        true,
      );
      toast("Notes saved", "success");
      setShowNotesModal(false);
    } catch (error: any) {
      toast(error.message || "Failed to save notes", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveApplication = async () => {
    if (!worker) return;

    setActionLoading("approve-app");
    try {
      await apiRequest(
        `/api/apply-work/admin/${worker._id}`,
        "PUT",
        { status: "approved", workerStatus: "screening_unlocked" },
        true,
      );
      toast("Application approved, screening unlocked", "success");
      loadWorkerData();
    } catch (error: any) {
      toast(error.message || "Failed to approve application", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectApplication = async (reason: string) => {
    if (!worker) return;

    setActionLoading("reject-app");
    try {
      await apiRequest(
        `/api/apply-work/admin/${worker._id}`,
        "PUT",
        { status: "rejected", rejectionReason: reason },
        true,
      );
      toast("Application rejected", "success");
      loadWorkerData();
    } catch (error: any) {
      toast(error.message || "Failed to reject application", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Identity validation - BLOCK actions if user data is missing
  const hasValidIdentity =
    worker?.user?._id && worker?.user?.email && worker?.user?.firstName;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Worker Not Found
          </h1>
          <Link
            href="/admin/workforce"
            className="text-cyan-400 hover:underline"
          >
            ← Back to Workforce
          </Link>
        </div>
      </div>
    );
  }

  const workerName = hasValidIdentity
    ? `${worker.user.firstName} ${worker.user.lastName || ""}`.trim()
    : "Unknown User";

  const tabs = [
    { id: "overview" as TabType, label: "Overview", icon: "👤" },
    { id: "applications" as TabType, label: "Applications", icon: "📋" },
    { id: "screening" as TabType, label: "Screening", icon: "📝" },
    { id: "projects" as TabType, label: "Projects", icon: "🎯" },
    { id: "proofs" as TabType, label: "Proofs", icon: "📸" },
    { id: "earnings" as TabType, label: "Earnings", icon: "💰" },
    { id: "activity" as TabType, label: "Activity Log", icon: "📜" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header with Identity Panel */}
      <div className="bg-slate-800/50 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
            <Link href="/admin/workforce" className="hover:text-cyan-400">
              Workforce Control Center
            </Link>
            <span>→</span>
            <span className="text-white">{workerName}</span>
          </div>

          {/* Identity Panel */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl font-bold text-white">
                {hasValidIdentity
                  ? worker.user.firstName.charAt(0).toUpperCase()
                  : "?"}
              </div>

              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  {workerName}
                  {!hasValidIdentity && (
                    <span className="text-red-400 text-sm font-normal bg-red-500/20 px-2 py-1 rounded">
                      ⚠️ Identity Missing - Actions Blocked
                    </span>
                  )}
                </h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-400 mt-1">
                  {hasValidIdentity && (
                    <span className="flex items-center gap-1">
                      📧 {worker.user.email}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    🏢 {worker.positionTitle}
                  </span>
                  <span className="flex items-center gap-1">
                    🆔 {worker._id.slice(-8)}
                  </span>
                  <span className="flex items-center gap-1">
                    📅 Joined {new Date(worker.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Status & Quick Actions */}
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`px-4 py-2 rounded-full border text-sm font-medium ${STATUS_COLORS[worker.workerStatus] || STATUS_COLORS.applied}`}
              >
                {STATUS_LABELS[worker.workerStatus] || worker.workerStatus}
              </span>

              {hasValidIdentity && (
                <>
                  <button
                    onClick={() => setShowStatusModal(true)}
                    className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg text-sm transition"
                  >
                    Change Status
                  </button>
                  <button
                    onClick={() => setShowNotesModal(true)}
                    className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg text-sm transition"
                  >
                    📝 Notes
                  </button>
                  {worker.workerStatus === "ready_to_work" && (
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm transition"
                    >
                      Assign Project
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-slate-800/30 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                  activeTab === tab.id
                    ? "border-cyan-500 text-cyan-400"
                    : "border-transparent text-slate-400 hover:text-white"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard
                    label="Total Earnings"
                    value={`$${worker.totalEarnings.toFixed(2)}`}
                    color="emerald"
                  />
                  <StatCard
                    label="Pending Earnings"
                    value={`$${worker.pendingEarnings.toFixed(2)}`}
                    color="amber"
                  />
                  <StatCard
                    label="Projects Done"
                    value={worker.projectsCompleted.length.toString()}
                    color="cyan"
                  />
                  <StatCard
                    label="Test Attempts"
                    value={`${worker.attemptCount}/${worker.maxAttempts}`}
                    color="purple"
                  />
                </div>

                {/* Current Status Card */}
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Current Status
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Application</span>
                      <span
                        className={`font-medium ${worker.status === "approved" ? "text-emerald-400" : worker.status === "rejected" ? "text-red-400" : "text-amber-400"}`}
                      >
                        {worker.status.charAt(0).toUpperCase() +
                          worker.status.slice(1)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Worker Status</span>
                      <span className="text-white font-medium">
                        {STATUS_LABELS[worker.workerStatus] ||
                          worker.workerStatus}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pay Rate</span>
                      <span className="text-white font-medium">
                        ${worker.payRate}/task
                      </span>
                    </div>
                    {worker.currentProject && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Active Project</span>
                        <span className="text-cyan-400 font-medium">
                          {worker.currentProject.title}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Resume & Application Details */}
                <div className="lg:col-span-3 bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Application Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm text-slate-400 block mb-2">
                        Application Message
                      </label>
                      <p className="text-white bg-slate-900/50 p-4 rounded-lg">
                        {worker.message || "No message provided"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm text-slate-400 block mb-2">
                        Resume
                      </label>
                      {worker.resumeUrl ? (
                        <a
                          href={worker.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600/20 text-cyan-400 rounded-lg hover:bg-cyan-600/30 transition"
                        >
                          📄 View Resume
                        </a>
                      ) : (
                        <p className="text-slate-500">No resume uploaded</p>
                      )}
                    </div>
                  </div>

                  {/* Admin Notes */}
                  {worker.adminNotes && (
                    <div className="mt-6">
                      <label className="text-sm text-slate-400 block mb-2">
                        Admin Notes
                      </label>
                      <p className="text-white bg-slate-900/50 p-4 rounded-lg">
                        {worker.adminNotes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                {hasValidIdentity &&
                  worker.status === "pending" &&
                  worker.workerStatus === "applied" && (
                    <div className="lg:col-span-3 bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-amber-400 mb-4">
                        ⚡ Pending Application Review
                      </h3>
                      <p className="text-slate-300 mb-4">
                        This worker has applied and is awaiting your review.
                        Approve to unlock their screening.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={handleApproveApplication}
                          disabled={actionLoading === "approve-app"}
                          className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition disabled:opacity-50"
                        >
                          {actionLoading === "approve-app"
                            ? "Approving..."
                            : "✓ Approve & Unlock Screening"}
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt("Rejection reason:");
                            if (reason) handleRejectApplication(reason);
                          }}
                          disabled={actionLoading === "reject-app"}
                          className="px-6 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition disabled:opacity-50"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* Applications Tab */}
            {activeTab === "applications" && (
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="p-6 border-b border-slate-700/50">
                  <h2 className="text-lg font-semibold text-white">
                    Job Applications
                  </h2>
                </div>
                <div className="p-6">
                  <div className="bg-slate-900/50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-white font-medium">
                          {worker.positionTitle}
                        </h3>
                        <p className="text-sm text-slate-400">
                          Applied on{" "}
                          {new Date(worker.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          worker.status === "approved"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : worker.status === "rejected"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {worker.status.charAt(0).toUpperCase() +
                          worker.status.slice(1)}
                      </span>
                    </div>
                    {worker.resumeUrl && (
                      <a
                        href={worker.resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 text-sm hover:underline"
                      >
                        📄 View Resume
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Screening Tab */}
            {activeTab === "screening" && (
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="p-6 border-b border-slate-700/50">
                  <h2 className="text-lg font-semibold text-white">
                    Screening & Tests
                  </h2>
                </div>
                <div className="p-6">
                  {/* Attempt Status */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <p className="text-sm text-slate-400">Attempts Used</p>
                      <p className="text-2xl font-bold text-white">
                        {worker.attemptCount} / {worker.maxAttempts}
                      </p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <p className="text-sm text-slate-400">
                        Screenings Completed
                      </p>
                      <p className="text-2xl font-bold text-white">
                        {worker.screeningsCompleted.length}
                      </p>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-4">
                      <p className="text-sm text-slate-400">Tests Passed</p>
                      <p className="text-2xl font-bold text-emerald-400">
                        {worker.testsCompleted.filter((t) => t.passed).length}
                      </p>
                    </div>
                  </div>

                  {/* Screening History */}
                  {worker.screeningsCompleted.length > 0 ? (
                    <div className="space-y-3">
                      <h3 className="text-white font-medium mb-3">
                        Screening History
                      </h3>
                      {worker.screeningsCompleted.map((s, i) => (
                        <div
                          key={i}
                          className="bg-slate-900/50 rounded-lg p-4 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-white">Screening #{i + 1}</p>
                            <p className="text-sm text-slate-400">
                              Completed{" "}
                              {new Date(s.completedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-sm ${s.score >= 70 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}
                          >
                            {s.score}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      No screenings completed yet
                    </div>
                  )}

                  {/* Test History */}
                  {worker.testsCompleted.length > 0 && (
                    <div className="mt-6 space-y-3">
                      <h3 className="text-white font-medium mb-3">
                        Test History
                      </h3>
                      {worker.testsCompleted.map((t, i) => (
                        <div
                          key={i}
                          className="bg-slate-900/50 rounded-lg p-4 flex items-center justify-between"
                        >
                          <div>
                            <p className="text-white">Test #{i + 1}</p>
                            <p className="text-sm text-slate-400">
                              {new Date(t.completedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-white">{t.score}%</span>
                            <span
                              className={`px-3 py-1 rounded-full text-sm ${t.passed ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}
                            >
                              {t.passed ? "Passed" : "Failed"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Manual Status Override for test_submitted */}
                  {hasValidIdentity &&
                    worker.workerStatus === "test_submitted" && (
                      <div className="mt-6 bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                        <h3 className="text-purple-400 font-medium mb-3">
                          ⚡ Test Pending Review
                        </h3>
                        <p className="text-slate-300 text-sm mb-4">
                          Worker has submitted their test. Review and mark as
                          passed or failed.
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setNewStatus("ready_to_work");
                              handleStatusChange();
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
                          >
                            ✓ Pass - Ready to Work
                          </button>
                          <button
                            onClick={() => {
                              setNewStatus("failed");
                              handleStatusChange();
                            }}
                            className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition"
                          >
                            ✕ Fail Test
                          </button>
                        </div>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Projects Tab */}
            {activeTab === "projects" && (
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="p-6 border-b border-slate-700/50 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">Projects</h2>
                  {hasValidIdentity &&
                    worker.workerStatus === "ready_to_work" && (
                      <button
                        onClick={() => setShowAssignModal(true)}
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm transition"
                      >
                        + Assign Project
                      </button>
                    )}
                </div>
                <div className="p-6">
                  {projects.length > 0 ? (
                    <div className="space-y-4">
                      {projects.map((project) => (
                        <div
                          key={project._id}
                          className="bg-slate-900/50 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-white font-medium">
                                {project.title}
                              </h3>
                              <p className="text-sm text-slate-400">
                                {project.category} • ${project.payRate}/{" "}
                                {project.payType}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-sm ${
                                project.status === "completed"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : project.status === "in_progress"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : project.status === "assigned"
                                      ? "bg-cyan-500/20 text-cyan-400"
                                      : "bg-slate-500/20 text-slate-400"
                              }`}
                            >
                              {project.status.replace("_", " ")}
                            </span>
                          </div>
                          {project.description && (
                            <p className="text-slate-400 text-sm mt-2">
                              {project.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                            {project.assignedAt && (
                              <span>
                                Assigned:{" "}
                                {new Date(
                                  project.assignedAt,
                                ).toLocaleDateString()}
                              </span>
                            )}
                            {project.completedAt && (
                              <span>
                                Completed:{" "}
                                {new Date(
                                  project.completedAt,
                                ).toLocaleDateString()}
                              </span>
                            )}
                            {project.earningsCredited && (
                              <span className="text-emerald-400">
                                Credited: ${project.earningsCredited}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      No projects assigned yet
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Proofs Tab */}
            {activeTab === "proofs" && (
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="p-6 border-b border-slate-700/50">
                  <h2 className="text-lg font-semibold text-white">
                    Proof of Work
                  </h2>
                </div>
                <div className="p-6">
                  {proofs.length > 0 ? (
                    <div className="space-y-4">
                      {proofs.map((proof) => (
                        <div
                          key={proof._id}
                          className="bg-slate-900/50 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="text-white font-medium">
                                {proof.projectId?.title || "Unknown Project"}
                              </h3>
                              <p className="text-sm text-slate-400">
                                Submitted{" "}
                                {new Date(proof.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-sm ${
                                proof.status === "approved"
                                  ? "bg-emerald-500/20 text-emerald-400"
                                  : proof.status === "rejected"
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-amber-500/20 text-amber-400"
                              }`}
                            >
                              {proof.status.charAt(0).toUpperCase() +
                                proof.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-slate-300 text-sm mt-2">
                            {proof.submissionText}
                          </p>
                          {proof.attachments.length > 0 && (
                            <div className="flex gap-2 mt-3">
                              {proof.attachments.map((att, i) => (
                                <a
                                  key={i}
                                  href={att.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-cyan-400 text-sm hover:underline"
                                >
                                  📎 {att.filename || `Attachment ${i + 1}`}
                                </a>
                              ))}
                            </div>
                          )}
                          {proof.status === "pending" && hasValidIdentity && (
                            <div className="flex gap-3 mt-4">
                              <button
                                onClick={() =>
                                  handleApproveProof(
                                    proof._id,
                                    proof.projectId?._id,
                                  )
                                }
                                disabled={
                                  actionLoading === `proof-${proof._id}`
                                }
                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm transition disabled:opacity-50"
                              >
                                {actionLoading === `proof-${proof._id}`
                                  ? "Processing..."
                                  : "✓ Approve & Credit"}
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt("Rejection reason:");
                                  if (reason)
                                    handleRejectProof(proof._id, reason);
                                }}
                                disabled={
                                  actionLoading === `proof-${proof._id}`
                                }
                                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg text-sm transition disabled:opacity-50"
                              >
                                ✕ Reject
                              </button>
                            </div>
                          )}
                          {proof.rejectionReason && (
                            <p className="text-red-400 text-sm mt-2">
                              Rejected: {proof.rejectionReason}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      No proofs submitted yet
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Earnings Tab */}
            {activeTab === "earnings" && (
              <div className="space-y-6">
                {/* Earnings Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                    <p className="text-sm text-slate-400 mb-1">
                      Total Earnings
                    </p>
                    <p className="text-3xl font-bold text-emerald-400">
                      ${worker.totalEarnings.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                    <p className="text-sm text-slate-400 mb-1">
                      Pending Earnings
                    </p>
                    <p className="text-3xl font-bold text-amber-400">
                      ${worker.pendingEarnings.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                    <p className="text-sm text-slate-400 mb-1">Pay Rate</p>
                    <p className="text-3xl font-bold text-white">
                      ${worker.payRate}/task
                    </p>
                  </div>
                </div>

                {/* Projects Completed with Earnings */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700/50">
                  <div className="p-6 border-b border-slate-700/50">
                    <h2 className="text-lg font-semibold text-white">
                      Earnings Breakdown
                    </h2>
                  </div>
                  <div className="p-6">
                    {worker.projectsCompleted.length > 0 ? (
                      <div className="space-y-3">
                        {worker.projectsCompleted.map((p, i) => (
                          <div
                            key={i}
                            className="bg-slate-900/50 rounded-lg p-4 flex items-center justify-between"
                          >
                            <div>
                              <p className="text-white">Project #{i + 1}</p>
                              <p className="text-sm text-slate-400">
                                Completed{" "}
                                {new Date(p.completedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <span className="text-emerald-400 font-bold">
                              +${p.earnings.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400">
                        No completed projects yet
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Activity Log Tab */}
            {activeTab === "activity" && (
              <div className="bg-slate-800/50 rounded-xl border border-slate-700/50">
                <div className="p-6 border-b border-slate-700/50">
                  <h2 className="text-lg font-semibold text-white">
                    Activity Timeline
                  </h2>
                </div>
                <div className="p-6">
                  {activities.length > 0 ? (
                    <div className="space-y-4">
                      {activities.map((event, i) => (
                        <div key={event._id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                event.type.includes("completed") ||
                                event.type.includes("passed")
                                  ? "bg-emerald-500"
                                  : event.type.includes("failed")
                                    ? "bg-red-500"
                                    : "bg-cyan-500"
                              }`}
                            />
                            {i < activities.length - 1 && (
                              <div className="w-0.5 h-full bg-slate-700 mt-1" />
                            )}
                          </div>
                          <div className="pb-4">
                            <p className="text-white">{event.description}</p>
                            <p className="text-sm text-slate-400">
                              {new Date(event.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      No activity recorded yet
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Status Change Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              Change Worker Status
            </h3>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full bg-slate-900 text-white rounded-lg px-4 py-3 mb-4 border border-slate-700 focus:border-cyan-500 outline-none"
            >
              <option value="">Select new status...</option>
              <option value="applied">Applied</option>
              <option value="screening_unlocked">Screening Unlocked</option>
              <option value="training_viewed">Training Viewed</option>
              <option value="test_submitted">Test Submitted</option>
              <option value="failed">Failed</option>
              <option value="ready_to_work">Ready to Work</option>
              <option value="assigned">Assigned</option>
              <option value="working">Working</option>
              <option value="suspended">Suspended</option>
            </select>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                disabled={!newStatus || actionLoading === "status"}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition disabled:opacity-50"
              >
                {actionLoading === "status" ? "Updating..." : "Update Status"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Project Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-lg w-full border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              Assign Project
            </h3>
            {availableProjects.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto mb-4">
                {availableProjects.map((project) => (
                  <label
                    key={project._id}
                    className={`flex items-center gap-3 p-4 rounded-lg cursor-pointer transition ${
                      selectedProjectId === project._id
                        ? "bg-cyan-600/20 border border-cyan-500"
                        : "bg-slate-900/50 border border-slate-700 hover:border-slate-600"
                    }`}
                  >
                    <input
                      type="radio"
                      name="project"
                      value={project._id}
                      checked={selectedProjectId === project._id}
                      onChange={() => setSelectedProjectId(project._id)}
                      className="hidden"
                    />
                    <div className="flex-1">
                      <p className="text-white font-medium">{project.title}</p>
                      <p className="text-sm text-slate-400">
                        {project.category} • ${project.payRate}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 mb-4">
                No available projects to assign
              </p>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedProjectId(null);
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignProject}
                disabled={!selectedProjectId || actionLoading === "assign"}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition disabled:opacity-50"
              >
                {actionLoading === "assign" ? "Assigning..." : "Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl p-6 max-w-lg w-full border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4">
              Admin Notes
            </h3>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add notes about this worker..."
              rows={5}
              className="w-full bg-slate-900 text-white rounded-lg px-4 py-3 mb-4 border border-slate-700 focus:border-cyan-500 outline-none resize-none"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowNotesModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={actionLoading === "notes"}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg transition disabled:opacity-50"
              >
                {actionLoading === "notes" ? "Saving..." : "Save Notes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper component for stats
function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: "emerald" | "amber" | "cyan" | "purple";
}) {
  const colors = {
    emerald: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
    amber: "from-amber-500/20 to-amber-600/10 border-amber-500/30",
    cyan: "from-cyan-500/20 to-cyan-600/10 border-cyan-500/30",
    purple: "from-purple-500/20 to-purple-600/10 border-purple-500/30",
  };
  const textColors = {
    emerald: "text-emerald-400",
    amber: "text-amber-400",
    cyan: "text-cyan-400",
    purple: "text-purple-400",
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-4 border`}>
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`text-2xl font-bold ${textColors[color]}`}>{value}</p>
    </div>
  );
}
