"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

export default function Dashboard() {
  const { user, isAdmin } = useAuth();

  const cards = [
    {
      title: "Buy a Service",
      desc: "Access manual onboarding & verification services.",
      href: "/buy-service",
      icon: "🛒",
    },
    {
      title: "My Orders",
      desc: "Track payment, verification & completion status.",
      href: "/orders",
      icon: "📦",
    },
    {
      title: "Apply to Work",
      desc: "Join UREMO as a manual operations specialist.",
      href: "/apply-to-work",
      icon: "💼",
    },
    {
      title: "Support",
      desc: "Get help through your order chat and updates.",
      href: "/support",
      icon: "🛟",
    },
  ];

  if (isAdmin) {
    cards.push({
      title: "Admin Desk",
      desc: "Manage orders, payments, services & reviews.",
      href: "/admin",
      icon: "🧰",
    });
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="u-container"
    >
      <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
      <p className="text-slate-300 mb-8">
        Human-assisted onboarding, verification & manual operations.
      </p>

      {user?.email && (
        <p className="text-sm text-[#9CA3AF] mb-6">
          Signed in as <span className="text-white">{user.email}</span>
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <Link key={card.href} href={card.href} className="block">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="card cursor-pointer pointer-events-auto"
            >
              <div className="text-4xl mb-3">{card.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{card.title}</h3>
              <p className="text-sm text-slate-300">{card.desc}</p>
            </motion.div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
