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
        <h1 className="text-5xl md:text-7xl font-bold mb-5 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
          Manual operations,
          <span className="block">done professionally.</span>
        </h1>
        <p className="text-base md:text-xl text-slate-300 max-w-2xl mx-auto mb-10">
          UREMO is a human-assisted operations desk for onboarding,
          verification, and account support—built for speed, accuracy, and
          trust.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/signup">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full sm:w-auto"
            >
              Get Started
            </motion.button>
          </Link>
          <Link href="/buy-service">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-secondary w-full sm:w-auto"
            >
              Browse Services
            </motion.button>
          </Link>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3 text-left">
          {[
            {
              title: "Manual verification",
              desc: "Real operators review submissions—no low-quality automation.",
            },
            {
              title: "Secure payments",
              desc: "Proof-based payments with verification and clear status tracking.",
            },
            {
              title: "Operations desk",
              desc: "Order-linked messaging and timelines for fast resolution.",
            },
          ].map((f) => (
            <div key={f.title} className="card">
              <h3 className="font-semibold text-lg">{f.title}</h3>
              <p className="text-sm text-slate-400 mt-2">{f.desc}</p>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Supported services band */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="max-w-6xl mx-auto px-4 sm:px-6 pb-10"
      >
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-6">
          <p className="text-xs tracking-widest text-[#9CA3AF]">
            SUPPORTED SERVICES
          </p>
          <div className="mt-3 flex flex-wrap gap-2 justify-center">
            {[
              "Outlier onboarding",
              "Handshake",
              "Airtm",
              "Binance",
              "Crypto accounts",
              "KYC assistance",
            ].map((tag) => (
              <span key={tag} className="u-pill text-slate-200">
                {tag}
              </span>
            ))}
          </div>
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

      {/* CTA */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="max-w-6xl mx-auto px-4 sm:px-6 py-16"
      >
        <div className="card text-center">
          <h2 className="text-2xl md:text-3xl font-bold">Ready to start?</h2>
          <p className="text-slate-300 mt-3 max-w-2xl mx-auto">
            Create an account, reserve a service, and complete payment to begin
            manual verification.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="btn-primary">
              Sign up
            </Link>
            <Link href="/buy-service" className="btn-secondary">
              Browse services
            </Link>
          </div>
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
          </div>
        </div>
      </footer>
    </div>
  );
}
