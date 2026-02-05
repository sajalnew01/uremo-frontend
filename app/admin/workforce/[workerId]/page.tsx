"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import {
  ConfirmActionModal,
  ActionType,
} from "@/components/admin/ConfirmActionModal";
import {
  WorkerLifecycleTimeline,
  WorkerRiskIndicators,
  ActiveProjectCard,
  ProjectCompletionConfirmation,
  deriveCompletionData,
} from "@/components/workforce";

/**
 * PATCH_62: Worker Command Center
 *
 * THE SINGLE SOURCE OF TRUTH for a single worker.
 * All worker lifecycle actions accessible from ONE place.
 *
 * Structure (Top to Bottom):
 * 1. Identity Block - Name, email, ID, job role, current status
 * 2. Journey Timeline - Visual worker progress
 * 3. Primary Action Panel - ONE action based on current status
 * 4. Contextual Details - Collapsible tabs for history
 *
 * KEY PRINCIPLE: Admin never asks "what next?" - UI tells them.
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
  completed: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  proof_submitted: "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

// PATCH_62: Human-readable status descriptions
const STATUS_DESCRIPTIONS: Record<string, string> = {
  applied: "Application pending — Awaiting admin review",
  screening_unlocked:
    "Screening unlocked — Waiting for worker to complete training",
  training_viewed: "Training completed — Waiting for worker to submit test",
  test_submitted: "Test submitted — Awaiting admin review",
  failed: "Screening failed — Can retry or be permanently rejected",
  ready_to_work: "Screening passed — Ready for project assignment",
  assigned: "Project assigned — Worker preparing to start",
  working: "Actively working — Project in progress",
  proof_submitted: "Proof submitted — Awaiting admin approval & payment",
  completed: "Project completed — Available for new assignments",
  suspended: "Account suspended — Contact admin for details",
  inactive: "Inactive — No recent activity",
  fresh: "New user — Not yet applied",
  screening_available: "Screening available — Ready to begin",
};

// PATCH_62: Journey steps for timeline
const JOURNEY_STEPS = [
  { key: "applied", label: "Applied", icon: "📝" },
  { key: "approved", label: "Approved", icon: "✅" },
  { key: "screening_unlocked", label: "Screening Unlocked", icon: "🔓" },
  { key: "training_viewed", label: "Training Viewed", icon: "📚" },
  { key: "test_submitted", label: "Test Submitted", icon: "📋" },
  { key: "ready_to_work", label: "Ready to Work", icon: "🎯" },
  { key: "assigned", label: "Project Assigned", icon: "📦" },
  { key: "working", label: "Working", icon: "⚡" },
  { key: "proof_submitted", label: "Proof Submitted", icon: "📸" },
  { key: "completed", label: "Completed", icon: "🏆" },
];

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

  // PATCH-64: Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    actionType: ActionType;
    title: string;
    description: string;
    details?: any;
    warningMessage?: string;
    confirmButtonText: string;
    isDangerous: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    actionType: "generic",
    title: "",
    description: "",
    confirmButtonText: "Confirm",
    isDangerous: false,
    onConfirm: async () => {},
  });

  // PATCH-64: Helper to show confirmation modal
  const showConfirmation = (config: Partial<typeof confirmModal>) => {
    setConfirmModal({
      ...confirmModal,
      isOpen: true,
      ...config,
    } as typeof confirmModal);
  };

  const closeConfirmation = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

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

  // PATCH-64: Wrapped with confirmation modal
  const handleApproveApplication = async () => {
    if (!worker) return;

    showConfirmation({
      actionType: "worker_approve",
      title: "Approve Worker Application",
      description: `You are about to APPROVE this worker's application. This will unlock screening access.`,
      details: {
        workerName:
          `${worker.user?.firstName || ""} ${worker.user?.lastName || ""}`.trim(),
        workerEmail: worker.user?.email,
        currentState: worker.workerStatus,
        targetState: "screening_unlocked",
      },
      confirmButtonText: "Approve Application",
      isDangerous: false,
      onConfirm: async () => {
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
      },
    });
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

  // PATCH_62: Additional action handlers for Command Center
  const handleUnlockScreening = async () => {
    if (!worker) return;

    setActionLoading("unlock");
    try {
      await apiRequest(
        `/api/admin/workspace/job/${worker.position?._id}/unlock-screening`,
        "PUT",
        { applicantId: worker._id },
        true,
      );
      toast("Screening unlocked successfully", "success");
      loadWorkerData();
    } catch (error: any) {
      toast(error.message || "Failed to unlock screening", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePassTest = async () => {
    if (!worker) return;

    setActionLoading("pass-test");
    try {
      await apiRequest(
        `/api/admin/workspace/worker/${worker._id}/status`,
        "PUT",
        { workerStatus: "ready_to_work" },
        true,
      );
      toast("Worker passed screening - Ready to work!", "success");
      loadWorkerData();
    } catch (error: any) {
      toast(error.message || "Failed to update status", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleFailTest = async () => {
    if (!worker) return;

    setActionLoading("fail-test");
    try {
      await apiRequest(
        `/api/admin/workspace/worker/${worker._id}/status`,
        "PUT",
        { workerStatus: "failed" },
        true,
      );
      toast("Worker failed screening", "success");
      loadWorkerData();
    } catch (error: any) {
      toast(error.message || "Failed to update status", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAllowRetry = async () => {
    if (!worker) return;

    setActionLoading("retry");
    try {
      await apiRequest(
        `/api/admin/workspace/worker/${worker._id}/status`,
        "PUT",
        {
          workerStatus: "screening_unlocked",
          attemptCount: worker.attemptCount,
        },
        true,
      );
      toast("Worker can now retry screening", "success");
      loadWorkerData();
    } catch (error: any) {
      toast(error.message || "Failed to allow retry", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // PATCH_62: Helper to get primary action description
  const getPrimaryActionDescription = (
    workerStatus: string,
    appStatus: string,
  ): string => {
    if (workerStatus === "applied" && appStatus === "pending") {
      return "Review this application and approve to unlock their screening access.";
    }
    if (workerStatus === "applied" && appStatus === "approved") {
      return "Application approved. Unlock screening to let worker begin training.";
    }
    if (
      workerStatus === "screening_unlocked" ||
      workerStatus === "training_viewed"
    ) {
      return "Worker is completing training and preparing for the test. No action needed yet.";
    }
    if (workerStatus === "test_submitted") {
      return "Worker submitted their test. Review answers and mark as passed or failed.";
    }
    if (workerStatus === "failed") {
      return "Worker failed screening. Allow them to retry or reject permanently.";
    }
    if (workerStatus === "ready_to_work") {
      return "Worker passed screening and is ready for their first project assignment.";
    }
    if (workerStatus === "assigned" || workerStatus === "working") {
      return "Worker is actively working on their assigned project.";
    }
    if (workerStatus === "proof_submitted") {
      return "Worker submitted proof of work. Review and approve to credit their earnings.";
    }
    if (workerStatus === "completed") {
      return "Project completed. Assign a new project or archive this worker.";
    }
    if (workerStatus === "suspended") {
      return "Worker is suspended. Unsuspend to allow them to continue working.";
    }
    return "Review worker status and take appropriate action.";
  };

  // PATCH_65: State transition helper - shows what each action will do
  const getStateTransitionInfo = (
    action: string,
  ): { from: string; to: string; icon: string } => {
    const transitions: Record<
      string,
      { from: string; to: string; icon: string }
    > = {
      "approve-app": {
        from: "Applied (Pending)",
        to: "Screening Unlocked",
        icon: "✓",
      },
      "reject-app": { from: "Applied", to: "Rejected", icon: "✕" },
      "unlock-screening": {
        from: "Applied (Approved)",
        to: "Screening Unlocked",
        icon: "🔓",
      },
      "pass-test": { from: "Test Submitted", to: "Ready to Work", icon: "✓" },
      "fail-test": { from: "Test Submitted", to: "Failed", icon: "✕" },
      "allow-retry": { from: "Failed", to: "Screening Unlocked", icon: "🔄" },
      "assign-project": { from: "Ready to Work", to: "Assigned", icon: "📦" },
      "approve-proof": { from: "Proof Submitted", to: "Completed", icon: "💰" },
      suspend: { from: "Current Status", to: "Suspended", icon: "🚫" },
      unsuspend: { from: "Suspended", to: "Ready to Work", icon: "✅" },
    };
    return transitions[action] || { from: "—", to: "—", icon: "?" };
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
      {/* PATCH_62: Worker Command Center Header */}
      <div className="bg-slate-800/50 border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
            <Link href="/admin/workforce" className="hover:text-cyan-400">
              Workforce Pipeline
            </Link>
            <span>→</span>
            <span className="text-cyan-400">Worker Command Center</span>
          </div>

          {/* SECTION 1: IDENTITY BLOCK */}
          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl font-bold text-white flex-shrink-0">
                  {hasValidIdentity
                    ? worker.user.firstName.charAt(0).toUpperCase()
                    : "?"}
                </div>

                <div className="flex-1">
                  {/* Page Title */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🧭</span>
                    <h1 className="text-2xl font-bold text-white">
                      Worker Command Center
                    </h1>
                  </div>
                  <p className="text-sm text-slate-400 mb-4">
                    All actions, history, and decisions for this worker — in one
                    place.
                  </p>

                  {/* Worker Name */}
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-2">
                    {workerName}
                    {!hasValidIdentity && (
                      <span className="text-red-400 text-xs font-normal bg-red-500/20 px-2 py-1 rounded">
                        ⚠️ Identity Missing
                      </span>
                    )}
                  </h2>

                  {/* Identity Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="bg-slate-800/50 rounded-lg p-2">
                      <p className="text-slate-500 text-xs">Email</p>
                      <p
                        className="text-white font-medium truncate cursor-pointer hover:text-cyan-400 transition"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            worker.user?.email || "",
                          );
                          toast("Email copied!", "success");
                        }}
                        title="Click to copy"
                      >
                        {worker.user?.email || "Not available"}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2">
                      <p className="text-slate-500 text-xs">Worker ID</p>
                      <p className="text-white font-mono text-xs">
                        {worker._id.slice(-8)}
                      </p>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2">
                      <p className="text-slate-500 text-xs">Job Role</p>
                      {worker.position?._id ? (
                        <Link
                          href={`/admin/work-positions/${worker.position._id}`}
                          className="text-cyan-400 hover:underline font-medium truncate block"
                        >
                          {worker.positionTitle}
                        </Link>
                      ) : (
                        <p className="text-white font-medium truncate">
                          {worker.positionTitle}
                        </p>
                      )}
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2">
                      <p className="text-slate-500 text-xs">Applied</p>
                      <p className="text-white font-medium">
                        {new Date(worker.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Status Badge */}
              <div className="flex flex-col items-start lg:items-end gap-2">
                <span
                  className={`px-4 py-2 rounded-full border text-sm font-medium ${STATUS_COLORS[worker.workerStatus] || STATUS_COLORS.applied}`}
                >
                  {STATUS_LABELS[worker.workerStatus] || worker.workerStatus}
                </span>
                <p className="text-sm text-slate-400 max-w-[250px] text-left lg:text-right">
                  {STATUS_DESCRIPTIONS[worker.workerStatus] || "Status unknown"}
                </p>

                {/* PATCH-65: Risk Indicators */}
                <div className="mt-2">
                  <WorkerRiskIndicators
                    workerStatus={worker.workerStatus}
                    applicationStatus={worker.status}
                    isFailed={worker.workerStatus === "failed"}
                    isSuspended={worker.workerStatus === "suspended"}
                    attemptCount={worker.attemptCount}
                    maxAttempts={worker.maxAttempts}
                    projectsCompleted={worker.projectsCompleted?.length || 0}
                    createdAt={worker.createdAt}
                    updatedAt={worker.updatedAt}
                    size="sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: JOURNEY TIMELINE - PATCH-65 Enhanced */}
      <div className="bg-slate-800/30 border-b border-slate-700/50 py-4">
        <div className="max-w-7xl mx-auto px-4">
          <WorkerLifecycleTimeline
            currentStatus={worker.workerStatus}
            applicationStatus={worker.status}
            createdAt={worker.createdAt}
            approvedAt={worker.approvedAt}
            approvedBy={worker.approvedBy}
            trainingViewedAt={worker.trainingViewedAt}
            isFailed={worker.workerStatus === "failed"}
            isSuspended={worker.workerStatus === "suspended"}
            layout="horizontal"
          />
        </div>
      </div>

      {/* SECTION 3: PRIMARY ACTION PANEL */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-gradient-to-r from-cyan-500/10 via-slate-800/50 to-purple-500/10 rounded-xl p-6 border border-cyan-500/20 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                ⚡ Next Action Required
              </h3>
              <p className="text-sm text-slate-400 mt-1">
                {getPrimaryActionDescription(
                  worker.workerStatus,
                  worker.status,
                )}
              </p>
            </div>

            {/* PRIMARY ACTION BUTTONS - Only ONE based on status */}
            <div className="flex flex-wrap gap-3">
              {/* Applied + Pending → Approve/Reject */}
              {worker.workerStatus === "applied" &&
                worker.status === "pending" &&
                hasValidIdentity && (
                  <>
                    <button
                      onClick={handleApproveApplication}
                      disabled={actionLoading === "approve-app"}
                      title="Approves application and unlocks screening access (Applied → Screening Unlocked)"
                      className="group px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
                    >
                      {actionLoading === "approve-app"
                        ? "Processing..."
                        : "✓ Approve Application"}
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt("Rejection reason:");
                        if (reason) handleRejectApplication(reason);
                      }}
                      disabled={actionLoading === "reject-app"}
                      title="Permanently rejects this application"
                      className="px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </>
                )}

              {/* Applied + Approved (legacy) → Unlock Screening */}
              {worker.workerStatus === "applied" &&
                worker.status === "approved" &&
                hasValidIdentity && (
                  <button
                    onClick={() => handleUnlockScreening()}
                    disabled={actionLoading === "unlock"}
                    title="Unlocks training and screening test access (Applied → Screening Unlocked)"
                    className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {actionLoading === "unlock"
                      ? "Processing..."
                      : "🔓 Unlock Screening"}
                  </button>
                )}

              {/* Screening Unlocked / Training Viewed → Waiting */}
              {(worker.workerStatus === "screening_unlocked" ||
                worker.workerStatus === "training_viewed") && (
                <div
                  className="px-6 py-3 bg-slate-700/50 text-slate-300 rounded-lg flex items-center gap-2"
                  title="Worker is completing training - no action available until they submit their test"
                >
                  <span className="animate-pulse">⏳</span>
                  Waiting for worker to submit test...
                </div>
              )}

              {/* Test Submitted → Pass/Fail */}
              {worker.workerStatus === "test_submitted" && hasValidIdentity && (
                <>
                  <button
                    onClick={() => handlePassTest()}
                    disabled={actionLoading === "pass-test"}
                    title="Marks screening as passed - worker becomes Ready to Work"
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {actionLoading === "pass-test"
                      ? "Processing..."
                      : "✓ Pass Screening"}
                  </button>
                  <button
                    onClick={() => handleFailTest()}
                    disabled={actionLoading === "fail-test"}
                    title="Marks screening as failed - worker can be given a retry later"
                    className="px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition disabled:opacity-50"
                  >
                    ✕ Fail Screening
                  </button>
                  <Link
                    href="/admin/workspace/screenings"
                    title="View the worker's submitted screening answers"
                    className="px-4 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition"
                  >
                    View Answers →
                  </Link>
                </>
              )}

              {/* Failed → Retry/Reject */}
              {worker.workerStatus === "failed" && hasValidIdentity && (
                <>
                  <button
                    onClick={() => handleAllowRetry()}
                    disabled={actionLoading === "retry"}
                    title="Resets worker status to Screening Unlocked so they can take the test again"
                    className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {actionLoading === "retry"
                      ? "Processing..."
                      : "🔄 Allow Retry"}
                  </button>
                  <button
                    onClick={() => {
                      const reason = prompt("Rejection reason:");
                      if (reason) handleRejectApplication(reason);
                    }}
                    title="Permanently rejects this worker - they cannot apply again"
                    className="px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition"
                  >
                    Reject Permanently
                  </button>
                </>
              )}

              {/* Ready to Work → Assign Project */}
              {worker.workerStatus === "ready_to_work" && hasValidIdentity && (
                <button
                  onClick={() => setShowAssignModal(true)}
                  title="Opens project assignment modal - worker status will change to Assigned"
                  className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition flex items-center gap-2"
                >
                  📦 Assign Project
                </button>
              )}

              {/* Assigned/Working → View Project */}
              {(worker.workerStatus === "assigned" ||
                worker.workerStatus === "working") && (
                <Link
                  href={
                    worker.currentProject ? `/admin/workspace/projects` : "#"
                  }
                  title="View the project this worker is currently assigned to"
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium transition flex items-center gap-2"
                >
                  👁️ View Active Project
                </Link>
              )}

              {/* Proof Submitted → Approve & Credit */}
              {(worker.workerStatus === "proof_submitted" ||
                proofs.some((p) => p.status === "pending")) &&
                hasValidIdentity && (
                  <button
                    onClick={() => {
                      const pendingProof = proofs.find(
                        (p) => p.status === "pending",
                      );
                      if (pendingProof) {
                        handleApproveProof(
                          pendingProof._id,
                          pendingProof.projectId?._id,
                        );
                      }
                    }}
                    disabled={actionLoading?.startsWith("proof-")}
                    title="Approves proof of work and credits earnings to worker's wallet"
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {actionLoading?.startsWith("proof-")
                      ? "Processing..."
                      : "💰 Approve Proof & Credit Earnings"}
                  </button>
                )}

              {/* Completed → New Project/Archive */}
              {worker.workerStatus === "completed" && hasValidIdentity && (
                <>
                  <button
                    onClick={() => setShowAssignModal(true)}
                    title="Opens project assignment modal - worker status will change to Assigned"
                    className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition flex items-center gap-2"
                  >
                    📦 Assign New Project
                  </button>
                  <button
                    onClick={() => {
                      setNewStatus("inactive");
                      handleStatusChange();
                    }}
                    title="Marks worker as inactive - they will not appear in active workforce lists"
                    className="px-4 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded-lg transition"
                  >
                    Archive Worker
                  </button>
                </>
              )}

              {/* Suspended → Unsuspend */}
              {worker.workerStatus === "suspended" && hasValidIdentity && (
                <button
                  onClick={() => {
                    setNewStatus("ready_to_work");
                    handleStatusChange();
                  }}
                  title="Removes suspension and returns worker to Ready to Work status"
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition"
                >
                  Unsuspend Worker
                </button>
              )}

              {/* Identity Missing - Show Warning */}
              {!hasValidIdentity && (
                <div className="px-6 py-3 bg-red-500/20 text-red-400 rounded-lg flex items-center gap-2">
                  ⚠️ Cannot take actions - Worker identity is incomplete
                </div>
              )}
            </div>
          </div>

          {/* Secondary Actions Row */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-700/50">
            <button
              onClick={() => setShowStatusModal(true)}
              className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded text-sm transition"
            >
              Manual Status Override
            </button>
            <button
              onClick={() => setShowNotesModal(true)}
              className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded text-sm transition"
            >
              📝 Admin Notes
            </button>
            {worker.resumeUrl && (
              <a
                href={worker.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 rounded text-sm transition"
              >
                📄 View Resume
              </a>
            )}
          </div>
        </div>

        {/* SECTION 4: CONTEXTUAL DETAILS (Collapsible Tabs) */}
        <div className="bg-slate-800/30 rounded-xl border border-slate-700/50">
          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-slate-700/50">
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
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="p-6"
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

                  {/* PATCH-65.1: Active Project Card - Prominent display */}
                  <div className="lg:col-span-3">
                    <ActiveProjectCard
                      project={
                        projects.find(
                          (p) =>
                            p.status === "in_progress" ||
                            p.status === "assigned",
                        ) || (worker.currentProject as any)
                      }
                      workerStatus={worker.workerStatus}
                      proof={proofs.find((p) => p.status === "pending")}
                      earnings={{
                        credited: worker.projectsCompleted.length > 0,
                        amount: worker.totalEarnings,
                        creditedAt: worker.projectsCompleted[0]?.completedAt,
                      }}
                      onViewProject={() => setActiveTab("projects")}
                    />
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
                    <h2 className="text-lg font-semibold text-white">
                      Projects
                    </h2>
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
                        {projects.map((project) => {
                          // PATCH-65.1: Find related proof for this project
                          const projectProof = proofs.find(
                            (p) => p.projectId?._id === project._id,
                          );
                          const isCompleted = project.status === "completed";
                          const completionData = deriveCompletionData(
                            project,
                            projectProof,
                            null,
                          );

                          return (
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

                              {/* PATCH-65.1: Project Completion Confirmation */}
                              {(isCompleted || projectProof) && (
                                <div className="mt-4">
                                  <ProjectCompletionConfirmation
                                    isCompleted={isCompleted}
                                    completion={completionData}
                                    showFullDetails={true}
                                  />
                                </div>
                              )}
                            </div>
                          );
                        })}
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
                                  {new Date(
                                    proof.createdAt,
                                  ).toLocaleDateString()}
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

      {/* PATCH-64: Safety Confirmation Modal */}
      <ConfirmActionModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmation}
        onConfirm={confirmModal.onConfirm}
        actionType={confirmModal.actionType}
        title={confirmModal.title}
        description={confirmModal.description}
        details={confirmModal.details}
        warningMessage={confirmModal.warningMessage}
        confirmButtonText={confirmModal.confirmButtonText}
        isDangerous={confirmModal.isDangerous}
      />
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
