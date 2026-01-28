"use client";

/**
 * PATCH_34: Onboarding Modal
 * Shows for first-time users to select their interest category
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, notifyAuthChanged } from "@/lib/api";

interface OnboardingModalProps {
  onComplete?: () => void;
}

const categories = [
  {
    id: "microjobs",
    icon: "💼",
    title: "Microjob Accounts",
    desc: "Clickworker, Appen, Toloka & more",
    color: "from-blue-500/20 to-blue-600/10",
    borderColor: "border-blue-500/30",
    hoverBorder: "hover:border-blue-500",
  },
  {
    id: "forex_crypto",
    icon: "📈",
    title: "Forex / Crypto Trading",
    desc: "Prop firms, trading accounts & signals",
    color: "from-emerald-500/20 to-emerald-600/10",
    borderColor: "border-emerald-500/30",
    hoverBorder: "hover:border-emerald-500",
  },
  {
    id: "banks_wallets",
    icon: "🏦",
    title: "Bank / Wallet Accounts",
    desc: "Digital wallets, payment processors",
    color: "from-purple-500/20 to-purple-600/10",
    borderColor: "border-purple-500/30",
    hoverBorder: "hover:border-purple-500",
  },
  {
    id: "general",
    icon: "🔍",
    title: "Just Exploring",
    desc: "I want to browse all services",
    color: "from-slate-500/20 to-slate-600/10",
    borderColor: "border-slate-500/30",
    hoverBorder: "hover:border-slate-400",
  },
];

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (categoryId: string) => {
    setSelected(categoryId);
    setLoading(true);

    try {
      // Save preference to backend
      await apiRequest("/api/auth/onboarding", "PUT", {
        interestCategory: categoryId,
      });

      // Update local storage user object
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          user.onboardingCompleted = true;
          user.interestCategory = categoryId;
          localStorage.setItem("user", JSON.stringify(user));
          notifyAuthChanged();
        } catch {
          // Ignore parse errors
        }
      }

      // Redirect to avail-service with category preselected
      if (categoryId === "general") {
        router.push("/avail-service");
      } else {
        // Map frontend category to backend category format
        const categoryMap: Record<string, string> = {
          microjobs: "gig_work",
          forex_crypto: "forex_crypto",
          banks_wallets: "banks_wallets",
        };
        router.push(`/avail-service?category=${categoryMap[categoryId] || ""}`);
      }

      onComplete?.();
    } catch (err) {
      console.error("[Onboarding] Error:", err);
      // Still redirect even on error
      router.push("/avail-service");
      onComplete?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-emerald-500/20 border border-white/10 mb-4">
            <span className="text-3xl">👋</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Welcome to UREMO
          </h2>
          <p className="text-slate-300">
            What type of services are you looking for?
          </p>
        </div>

        {/* Category Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleSelect(cat.id)}
              disabled={loading}
              className={`
                relative text-left p-5 rounded-xl border transition-all duration-200
                bg-gradient-to-br ${cat.color} ${cat.borderColor} ${cat.hoverBorder}
                hover:scale-[1.02] active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed
                ${selected === cat.id ? "ring-2 ring-blue-500 border-blue-500" : ""}
              `}
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">{cat.icon}</span>
                <div>
                  <h3 className="font-semibold text-white mb-1">{cat.title}</h3>
                  <p className="text-sm text-slate-400">{cat.desc}</p>
                </div>
              </div>
              {selected === cat.id && loading && (
                <div className="absolute top-3 right-3">
                  <div className="w-5 h-5 border-2 border-white/20 border-t-blue-500 rounded-full animate-spin" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-500">
          You can change this preference anytime in your profile settings
        </p>
      </div>
    </div>
  );
}
