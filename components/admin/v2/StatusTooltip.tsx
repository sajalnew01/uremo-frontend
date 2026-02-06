"use client";

/**
 * PATCH_66: UX Safety Layer
 * Status Tooltip with explanations
 */

import { useState } from "react";

interface StatusTooltipProps {
  status: string;
  children: React.ReactNode;
}

const statusExplanations: Record<
  string,
  { title: string; description: string; nextStep?: string }
> = {
  // Worker statuses
  applied: {
    title: "Application Submitted",
    description:
      "Worker has submitted their application. Waiting for admin review.",
    nextStep: "Review application and approve/reject",
  },
  approved: {
    title: "Application Approved",
    description:
      "Worker's application was approved. They can now access screening.",
    nextStep: "Worker will receive screening test",
  },
  screening_unlocked: {
    title: "Screening Available",
    description: "Worker can now take the screening test for this position.",
    nextStep: "Wait for worker to complete screening",
  },
  training_viewed: {
    title: "Training Completed",
    description: "Worker has viewed all required training materials.",
    nextStep: "Worker needs to pass the screening test",
  },
  test_submitted: {
    title: "Test Submitted",
    description: "Worker has completed the screening test. Awaiting grading.",
    nextStep: "Review and grade the test submission",
  },
  ready_to_work: {
    title: "Ready to Work",
    description:
      "Worker has passed all requirements and can receive project assignments.",
    nextStep: "Assign a project to this worker",
  },
  assigned: {
    title: "Project Assigned",
    description: "Worker has been assigned to a project and should begin work.",
    nextStep: "Worker is working on assigned project",
  },
  working: {
    title: "Actively Working",
    description: "Worker is currently working on their assigned project.",
    nextStep: "Wait for worker to submit proof of work",
  },
  suspended: {
    title: "Account Suspended",
    description: "Worker's account has been suspended by an admin.",
    nextStep:
      "Review suspension reason and decide to reinstate or keep suspended",
  },
  rejected: {
    title: "Application Rejected",
    description: "Worker's application was rejected.",
    nextStep: "No further action needed",
  },

  // Order statuses
  pending: {
    title: "Order Pending",
    description: "Order has been created but payment method not yet selected.",
    nextStep: "Wait for user to select payment method",
  },
  payment_pending: {
    title: "Payment Pending",
    description: "User has selected payment method. Awaiting proof of payment.",
    nextStep: "Wait for user to upload payment proof",
  },
  payment_submitted: {
    title: "Payment Submitted",
    description: "User has uploaded payment proof. Requires verification.",
    nextStep: "Verify the payment proof",
  },
  in_progress: {
    title: "In Progress",
    description: "Order is being processed after payment verification.",
    nextStep: "Complete the order deliverables",
  },
  waiting_user: {
    title: "Waiting on User",
    description: "Order requires action from the user to continue.",
    nextStep: "Wait for user response",
  },
  completed: {
    title: "Completed",
    description: "Order has been fulfilled and completed.",
    nextStep: "No further action needed",
  },
  cancelled: {
    title: "Cancelled",
    description: "Order has been cancelled.",
    nextStep: "Consider archiving if needed",
  },

  // Project statuses
  project_open: {
    title: "Open Project",
    description: "Project is available for assignment to a worker.",
    nextStep: "Assign a ready worker to this project",
  },
  project_in_progress: {
    title: "Project In Progress",
    description: "Assigned worker is currently working on this project.",
    nextStep: "Wait for worker to submit proof",
  },

  // Default
  default: {
    title: "Status",
    description: "Current status of this item.",
  },
};

export default function StatusTooltip({
  status,
  children,
}: StatusTooltipProps) {
  const [show, setShow] = useState(false);

  const normalizedStatus = status.toLowerCase().replace(/[- ]/g, "_");
  const info =
    statusExplanations[normalizedStatus] || statusExplanations.default;

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}

      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64">
          <div className="bg-[#0a0d14] border border-white/10 rounded-xl shadow-2xl overflow-hidden">
            <div className="p-3 border-b border-white/5">
              <div className="font-semibold text-white text-sm">
                {info.title}
              </div>
            </div>
            <div className="p-3 space-y-2">
              <p className="text-xs text-slate-400">{info.description}</p>
              {info.nextStep && (
                <div className="flex items-start gap-2 pt-2 border-t border-white/5">
                  <span className="text-blue-400 text-xs">→</span>
                  <span className="text-xs text-blue-400">{info.nextStep}</span>
                </div>
              )}
            </div>
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-[#0a0d14]" />
        </div>
      )}
    </div>
  );
}
