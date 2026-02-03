"use client";

/**
 * PATCH_55: Service Flow Timeline Component
 *
 * Shows a dynamic "What Happens Next?" timeline based on the selected action.
 */

import { useState } from "react";

type ActionType = "buy" | "apply" | "rent" | "deal";

type FlowStep = {
  icon: string;
  title: string;
  description: string;
};

type FlowConfig = {
  title: string;
  color: string;
  gradient: string;
  steps: FlowStep[];
};

const FLOW_CONFIGS: Record<ActionType, FlowConfig> = {
  buy: {
    title: "Buy Flow",
    color: "blue",
    gradient: "from-blue-500 to-indigo-600",
    steps: [
      {
        icon: "1️⃣",
        title: "Place Order",
        description: "Select service and create your order",
      },
      {
        icon: "2️⃣",
        title: "Upload Payment Proof",
        description: "Complete payment and upload confirmation",
      },
      {
        icon: "3️⃣",
        title: "Admin Verification",
        description: "Our team verifies and processes your order",
      },
      {
        icon: "4️⃣",
        title: "Delivery Completed",
        description: "Receive your service with proof of delivery",
      },
    ],
  },
  apply: {
    title: "Apply Flow",
    color: "emerald",
    gradient: "from-emerald-500 to-teal-600",
    steps: [
      {
        icon: "1️⃣",
        title: "Apply to Job",
        description: "Submit your application for the role",
      },
      {
        icon: "2️⃣",
        title: "Screening Test",
        description: "Complete verification and skills assessment",
      },
      {
        icon: "3️⃣",
        title: "Project Assignment",
        description: "Get assigned to real projects when available",
      },
      {
        icon: "4️⃣",
        title: "Earn & Withdraw",
        description: "Complete tasks and withdraw to your wallet",
      },
    ],
  },
  rent: {
    title: "Rent Flow",
    color: "purple",
    gradient: "from-purple-500 to-pink-600",
    steps: [
      {
        icon: "1️⃣",
        title: "Choose Plan",
        description: "Select your preferred rental duration",
      },
      {
        icon: "2️⃣",
        title: "Payment",
        description: "Complete secure payment for the rental",
      },
      {
        icon: "3️⃣",
        title: "Access Activated",
        description: "Receive credentials and start using immediately",
      },
      {
        icon: "4️⃣",
        title: "Manage / Renew",
        description: "Extend or cancel your rental anytime",
      },
    ],
  },
  deal: {
    title: "Deal Flow",
    color: "orange",
    gradient: "from-orange-500 to-amber-600",
    steps: [
      {
        icon: "1️⃣",
        title: "Start Deal",
        description: "Initiate the deal with your percentage offer",
      },
      {
        icon: "2️⃣",
        title: "Complete Tasks",
        description: "Work on assigned tasks with the seller",
      },
      {
        icon: "3️⃣",
        title: "Admin Review",
        description: "Our team verifies completed work",
      },
      {
        icon: "4️⃣",
        title: "Payout Credited",
        description: "Commission credited to your wallet",
      },
    ],
  },
};

type ServiceFlowTimelineProps = {
  allowedActions: {
    buy: boolean;
    apply: boolean;
    rent: boolean;
    deal: boolean;
  };
  defaultAction?: ActionType;
};

export default function ServiceFlowTimeline({
  allowedActions,
  defaultAction,
}: ServiceFlowTimelineProps) {
  // Get available actions
  const availableActions = (Object.keys(allowedActions) as ActionType[]).filter(
    (key) => allowedActions[key],
  );

  // Default to first available action or provided default
  const [selectedAction, setSelectedAction] = useState<ActionType>(
    defaultAction && allowedActions[defaultAction]
      ? defaultAction
      : availableActions[0] || "buy",
  );

  if (availableActions.length === 0) {
    return null;
  }

  const config = FLOW_CONFIGS[selectedAction];

  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">What Happens Next?</h2>
          <p className="text-sm text-slate-400 mt-1">
            See the step-by-step process for your chosen action
          </p>
        </div>

        {/* Action Tabs */}
        {availableActions.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {availableActions.map((action) => {
              const actionConfig = FLOW_CONFIGS[action];
              const isActive = selectedAction === action;
              return (
                <button
                  key={action}
                  type="button"
                  onClick={() => setSelectedAction(action)}
                  className={`
                    px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${
                      isActive
                        ? `bg-gradient-to-r ${actionConfig.gradient} text-white shadow-lg`
                        : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/10"
                    }
                  `}
                >
                  {action.charAt(0).toUpperCase() + action.slice(1)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Connection Line */}
        <div
          className={`absolute left-5 top-8 bottom-8 w-0.5 bg-gradient-to-b ${config.gradient} opacity-30`}
        />

        <div className="space-y-6">
          {config.steps.map((step, idx) => (
            <div key={idx} className="flex gap-4 relative">
              {/* Step Number Circle */}
              <div
                className={`
                  flex-shrink-0 w-10 h-10 rounded-full 
                  bg-gradient-to-br ${config.gradient}
                  flex items-center justify-center z-10
                  shadow-lg
                `}
              >
                <span className="text-white font-bold text-sm">{idx + 1}</span>
              </div>

              {/* Step Content */}
              <div className="flex-1 pb-2">
                <p className="font-semibold text-white">{step.title}</p>
                <p className="text-sm text-slate-400 mt-0.5">
                  {step.description}
                </p>
              </div>

              {/* Completion Indicator (visual only) */}
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-white/5 flex items-center justify-center">
                <span className="text-slate-500 text-xs">○</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Note */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <p className="text-xs text-slate-500 text-center">
          Each step is tracked in your dashboard. Need help?{" "}
          <span className="text-blue-400 cursor-pointer hover:underline">
            Contact support
          </span>
        </p>
      </div>
    </div>
  );
}
