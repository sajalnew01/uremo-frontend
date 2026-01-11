"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

export default function LandingPage() {
  const router = useRouter();
  const { ready, isAuthenticated } = useAuth();

  useEffect(() => {
    // Redirect logged-in users to dashboard
    if (ready && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [ready, isAuthenticated, router]);

  // While checking auth or if authenticated (before redirect), show minimal loading
  if (!ready || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-32 text-center"
      >
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
          Manual. Secure. Verified.
        </h1>
        <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10">
          Human-assisted onboarding, verification, and manual operations for
          platforms that require real expertise.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/signup">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn-primary w-full sm:w-auto"
            >
              Get Started
            </motion.button>
          </Link>
          <Link href="/login">
            <button className="btn-secondary w-full sm:w-auto">Login</button>
          </Link>
          <Link href="/buy-service">
            <button className="btn-secondary w-full sm:w-auto">
              Browse Services
            </button>
          </Link>
        </div>
      </motion.section>

      {/* 3-Step Process */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="max-w-6xl mx-auto px-4 sm:px-6 py-16"
      >
        <h2 className="text-3xl font-bold text-center mb-12">
          How UREMO Works
        </h2>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: "1",
              title: "Choose a Service",
              desc: "Select from KYC verification, account onboarding, or gig work.",
            },
            {
              step: "2",
              title: "Submit & Pay",
              desc: "Provide required details and complete secure payment.",
            },
            {
              step: "3",
              title: "Get Verified",
              desc: "Our team manually processes your request with care.",
            },
          ].map((item) => (
            <motion.div
              key={item.step}
              whileHover={{ y: -4 }}
              className="card text-center"
            >
              <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {item.step}
              </div>
              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-slate-400">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Features */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="max-w-6xl mx-auto px-4 sm:px-6 py-16"
      >
        <h2 className="text-3xl font-bold text-center mb-12">
          Why Choose UREMO
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: "🔒",
              title: "Manual Verification",
              desc: "Every request is reviewed by real humans, not bots.",
            },
            {
              icon: "⚡",
              title: "Flexible Payments",
              desc: "PayPal, Crypto (USDT), or Binance—your choice.",
            },
            {
              icon: "🌐",
              title: "Work Opportunities",
              desc: "Join our team as a manual operations specialist.",
            },
          ].map((feat, i) => (
            <motion.div key={i} whileHover={{ scale: 1.02 }} className="card">
              <div className="text-4xl mb-4">{feat.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{feat.title}</h3>
              <p className="text-sm text-slate-400">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Trust Disclaimer */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        className="max-w-4xl mx-auto px-4 sm:px-6 py-16"
      >
        <div className="card text-center">
          <p className="text-slate-300 leading-relaxed">
            ⚠️ <strong>All services are processed manually.</strong>{" "}
            Verification, approval, and delivery times may vary. UREMO is not
            responsible for delays outside our control. By using our services,
            you acknowledge that manual processing takes time.
          </p>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-center text-sm text-slate-400">
          <p>© 2026 UREMO. Manual operations for platforms that matter.</p>
          <div className="flex justify-center gap-6 mt-4">
            <Link href="/buy-service" className="hover:text-white transition">
              Services
            </Link>
            <Link href="/apply-to-work" className="hover:text-white transition">
              Work With Us
            </Link>
            <Link href="/login" className="hover:text-white transition">
              Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
