"use client";

import React from "react";

/**
 * PATCH_37: Order Timeline Stepper
 * Visual stepper showing order progress through normalized statuses:
 * pending → in_progress → completed
 * (cancelled is a terminal state shown separately)
 */

interface OrderStepperProps {
  status: string;
}

const STEPS = [
  { key: "pending", label: "Pending", icon: "⏳" },
  { key: "in_progress", label: "In Progress", icon: "⚡" },
  { key: "completed", label: "Completed", icon: "🎉" },
];

export default function OrderStepper({ status }: OrderStepperProps) {
  // Map current status to step index
  const getStepIndex = (currentStatus: string): number => {
    switch (currentStatus) {
      case "pending":
        return 0;
      case "waiting_user":
        return 0; // Still in pending phase (awaiting verification)
      case "in_progress":
        return 1;
      case "completed":
        return 2;
      case "cancelled":
        return -1; // Terminal/cancelled
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(status);
  const isCancelled = status === "cancelled";

  if (isCancelled) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">❌</span>
          <div>
            <p className="font-semibold text-red-200">Order Cancelled</p>
            <p className="text-sm text-red-300/80">
              This order has been cancelled.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between">
        {STEPS.map((step, idx) => {
          const isActive = idx === currentIndex;
          const isCompleted = idx < currentIndex;
          const isPast = idx <= currentIndex;

          return (
            <React.Fragment key={step.key}>
              {/* Step circle */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-xl
                    transition-all duration-300
                    ${
                      isCompleted
                        ? "bg-emerald-500 text-white"
                        : isActive
                          ? "bg-purple-500 text-white ring-4 ring-purple-500/30"
                          : "bg-slate-700 text-slate-400"
                    }
                  `}
                >
                  {isCompleted ? "✓" : step.icon}
                </div>
                <span
                  className={`text-xs font-medium ${
                    isPast ? "text-white" : "text-slate-500"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line (not after last step) */}
              {idx < STEPS.length - 1 && (
                <div
                  className={`
                    flex-1 h-1 mx-2 rounded-full transition-all duration-300
                    ${isCompleted ? "bg-emerald-500" : "bg-slate-700"}
                  `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Status-specific message */}
      <div className="mt-4 pt-4 border-t border-white/10">
        {status === "pending" && (
          <p className="text-sm text-slate-300">
            📋 Your order is pending. Please complete payment to proceed.
          </p>
        )}
        {status === "waiting_user" && (
          <p className="text-sm text-amber-300">
            🔍 Payment submitted! We're verifying your payment proof.
          </p>
        )}
        {status === "in_progress" && (
          <p className="text-sm text-purple-300">
            ⚡ Your order is being processed. We'll update you on progress.
          </p>
        )}
        {status === "completed" && (
          <p className="text-sm text-emerald-300">
            🎉 Order completed! Thank you for your purchase.
          </p>
        )}
      </div>
    </div>
  );
}
