"use client";

/**
 * PATCH_33: TrustBadges Component
 * Displays trust indicators across service pages
 */

interface TrustBadgesProps {
  variant?: "horizontal" | "vertical" | "grid";
  className?: string;
}

const badges = [
  {
    icon: "✔",
    text: "Manual Verification",
    description: "Each order is verified by our team",
  },
  {
    icon: "👥",
    text: "Human Assistance",
    description: "Real support, not bots",
  },
  {
    icon: "🔒",
    text: "Secure Payments",
    description: "Multiple payment options",
  },
  {
    icon: "📊",
    text: "Transparent Tracking",
    description: "Follow your order status",
  },
];

export default function TrustBadges({
  variant = "horizontal",
  className = "",
}: TrustBadgesProps) {
  if (variant === "vertical") {
    return (
      <div className={`space-y-3 ${className}`}>
        {badges.map((badge) => (
          <div
            key={badge.text}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
          >
            <span className="text-emerald-400 text-lg">{badge.icon}</span>
            <div>
              <p className="text-sm font-medium text-white">{badge.text}</p>
              <p className="text-xs text-slate-400">{badge.description}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "grid") {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
        {badges.map((badge) => (
          <div
            key={badge.text}
            className="flex flex-col items-center text-center p-4 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all"
          >
            <span className="text-2xl text-emerald-400 mb-2">{badge.icon}</span>
            <p className="text-sm font-medium text-white">{badge.text}</p>
            <p className="text-xs text-slate-400 mt-1">{badge.description}</p>
          </div>
        ))}
      </div>
    );
  }

  // Default: horizontal
  return (
    <div
      className={`flex flex-wrap items-center justify-center gap-4 md:gap-6 ${className}`}
    >
      {badges.map((badge) => (
        <div key={badge.text} className="flex items-center gap-2">
          <span className="text-emerald-400">{badge.icon}</span>
          <span className="text-sm text-slate-300">{badge.text}</span>
        </div>
      ))}
    </div>
  );
}
