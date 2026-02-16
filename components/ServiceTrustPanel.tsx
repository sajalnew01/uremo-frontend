"use client";

/**
 * PATCH_55: Service Trust Panel Component
 *
 * Displays trust and safety signals to build user confidence.
 * NO fake numbers, NO testimonials, NO animations.
 */

const TRUST_SIGNALS = [
  {
    icon: "Verify",
    title: "Manual Admin Verification",
    description: "Every order is reviewed by our team before processing",
  },
  {
    icon: "Proof",
    title: "Proof-Based Delivery",
    description: "All deliveries include verification proofs you can review",
  },
  {
    icon: "Wallet",
    title: "Secure Wallet System",
    description: "Funds are protected in your UREMO wallet until delivery",
  },
  {
    icon: "People",
    title: "Human-Reviewed Workers",
    description: "All workers pass screening and identity verification",
  },
  {
    icon: "Support",
    title: "Dedicated Support",
    description: "Real human support available for any issues or questions",
  },
];

export default function ServiceTrustPanel() {
  return (
    <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950/80 p-6 md:p-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
          <span className="text-xl">Safe</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">
            Why This Service Is Safe on UREMO
          </h2>
          <p className="text-sm text-slate-400">
            Your security is our top priority
          </p>
        </div>
      </div>

      {/* Trust Signals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TRUST_SIGNALS.map((signal, idx) => (
          <div
            key={idx}
            className="flex gap-3 p-4 rounded-xl border border-white/5 bg-white/5 hover:border-white/10 transition-colors"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-xl">
              {signal.icon}
            </div>
            <div>
              <p className="font-medium text-white text-sm">{signal.title}</p>
              <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                {signal.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Assurance */}
      <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-center gap-2 text-sm text-slate-400">
        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
        <span>All transactions are monitored and protected</span>
      </div>
    </div>
  );
}
