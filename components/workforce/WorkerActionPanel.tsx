"use client";

import { useState } from "react";
import { WorkerData } from "./WorkerPipelineCard";

/**
 * PATCH_60: Worker Action Panel
 * Reusable action panel for performing worker operations
 */

interface Project {
  _id: string;
  title: string;
  earnings: number;
  status: string;
}

interface WorkerActionPanelProps {
  type: "assign_project" | "credit_earnings" | "reject_proof";
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  worker?: WorkerData | null;
  projects?: Project[];
  proofId?: string;
  defaultAmount?: number;
  loading?: boolean;
}

export default function WorkerActionPanel({
  type,
  isOpen,
  onClose,
  onConfirm,
  worker,
  projects = [],
  proofId,
  defaultAmount = 0,
  loading,
}: WorkerActionPanelProps) {
  const [selectedProject, setSelectedProject] = useState("");
  const [creditAmount, setCreditAmount] = useState(defaultAmount);
  const [rejectReason, setRejectReason] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    switch (type) {
      case "assign_project":
        if (selectedProject) {
          onConfirm({ projectId: selectedProject });
          setSelectedProject("");
        }
        break;
      case "credit_earnings":
        if (creditAmount > 0) {
          onConfirm({ amount: creditAmount });
          setCreditAmount(0);
        }
        break;
      case "reject_proof":
        if (rejectReason.trim()) {
          onConfirm({ reason: rejectReason, proofId });
          setRejectReason("");
        }
        break;
    }
  };

  const renderContent = () => {
    switch (type) {
      case "assign_project":
        return (
          <>
            <h3 className="text-lg font-semibold text-white mb-4">
              Assign Project
            </h3>
            {worker && (
              <p className="text-sm text-slate-400 mb-4">
                Assigning to:{" "}
                <span className="text-white">
                  {worker.userId?.firstName} {worker.userId?.lastName}
                </span>
              </p>
            )}
            {projects.length > 0 ? (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {projects.map((project) => (
                  <label
                    key={project._id}
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedProject === project._id
                        ? "bg-blue-600/20 border border-blue-500/50"
                        : "bg-white/5 border border-transparent hover:bg-white/10"
                    }`}
                  >
                    <input
                      type="radio"
                      name="project"
                      value={project._id}
                      checked={selectedProject === project._id}
                      onChange={(e) => setSelectedProject(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-white">{project.title}</p>
                      <p className="text-xs text-emerald-400">
                        ${project.earnings.toFixed(2)}
                      </p>
                    </div>
                    {selectedProject === project._id && (
                      <span className="text-blue-400">✓</span>
                    )}
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm py-4 text-center">
                No available projects. Create a project first.
              </p>
            )}
          </>
        );

      case "credit_earnings":
        return (
          <>
            <h3 className="text-lg font-semibold text-white mb-4">
              Credit Earnings
            </h3>
            {worker && (
              <p className="text-sm text-slate-400 mb-4">
                Crediting to:{" "}
                <span className="text-white">
                  {worker.userId?.firstName} {worker.userId?.lastName}
                </span>
              </p>
            )}
            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">
                Amount ($)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={creditAmount}
                onChange={(e) =>
                  setCreditAmount(parseFloat(e.target.value) || 0)
                }
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white text-lg font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>
            <p className="text-xs text-slate-500">
              This will be added to the worker&apos;s wallet balance.
            </p>
          </>
        );

      case "reject_proof":
        return (
          <>
            <h3 className="text-lg font-semibold text-white mb-4">
              Reject Proof
            </h3>
            <div className="mb-4">
              <label className="block text-sm text-slate-400 mb-2">
                Rejection Reason (required)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why the proof is being rejected..."
                className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm resize-none h-28 focus:outline-none focus:border-red-500"
              />
            </div>
            <p className="text-xs text-slate-500">
              The worker will be notified and can resubmit their proof.
            </p>
          </>
        );

      default:
        return null;
    }
  };

  const getConfirmButton = () => {
    switch (type) {
      case "assign_project":
        return {
          label: "Assign",
          disabled: !selectedProject,
          color: "bg-blue-600 hover:bg-blue-700",
        };
      case "credit_earnings":
        return {
          label: `Credit $${creditAmount.toFixed(2)}`,
          disabled: creditAmount <= 0,
          color: "bg-emerald-600 hover:bg-emerald-700",
        };
      case "reject_proof":
        return {
          label: "Reject Proof",
          disabled: !rejectReason.trim(),
          color: "bg-red-600 hover:bg-red-700",
        };
      default:
        return { label: "Confirm", disabled: true, color: "bg-slate-600" };
    }
  };

  const confirmBtn = getConfirmButton();

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 rounded-xl p-5 w-full max-w-md border border-white/10"
      >
        {renderContent()}

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirmBtn.disabled || loading}
            className={`flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${confirmBtn.color}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Processing...
              </span>
            ) : (
              confirmBtn.label
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
