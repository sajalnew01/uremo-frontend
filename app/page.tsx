"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/api";

type Service = {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  price: number;
  currency?: string;
  deliveryType?: string;
  images?: string[];
  active?: boolean;
};

export default function LandingPage() {
  const router = useRouter();
  const { ready, isAuthenticated } = useAuth();

  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

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

  useEffect(() => {
    let mounted = true;
    setServicesLoading(true);

    apiRequest<Service[]>("/api/services")
      .then((data) => {
        if (!mounted) return;
        setServices(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!mounted) return;
        setServices([]);
      })
      .finally(() => {
        if (!mounted) return;
        setServicesLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const popularServices = useMemo(() => {
    const list = Array.isArray(services) ? services : [];
    // Prefer active services; keep stable ordering.
    const activeFirst = list
      .slice()
      .sort((a, b) => Number(Boolean(b.active)) - Number(Boolean(a.active)));
    return activeFirst.slice(0, 3);
  }, [services]);

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

        <div className="grid md:grid-cols-4 gap-6">
          {[
            {
              icon: "🧭",
              title: "Pick a service",
              desc: "Choose the exact manual operation you need.",
            },
            {
              icon: "🧾",
              title: "Submit requirements",
              desc: "We collect what’s needed to deliver accurately.",
            },
            {
              icon: "🔎",
              title: "Manual review",
              desc: "A real operator processes your request carefully.",
            },
            {
              icon: "✅",
              title: "Delivery + support",
              desc: "Track status and chat with the team in your order.",
            },
          ].map((item) => (
            <motion.div
              key={item.title}
              whileHover={{ y: -4 }}
              className="card text-center"
            >
              <div className="w-12 h-12 rounded-full bg-blue-500/15 border border-blue-500/20 text-blue-100 flex items-center justify-center text-xl font-bold mx-auto mb-4">
                {item.icon}
              </div>
              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-sm text-slate-400">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Popular services */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.7 }}
        viewport={{ once: true }}
        className="max-w-6xl mx-auto px-4 sm:px-6 py-16"
      >
        <div className="flex items-end justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-3xl font-bold">Popular services</h2>
            <p className="text-slate-300 mt-2 max-w-2xl">
              Start with our most-requested manual operations.
            </p>
          </div>
          <Link href="/buy-service" className="btn-secondary px-4 py-2 text-sm">
            Browse all
          </Link>
        </div>

        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {servicesLoading ? (
            [0, 1, 2].map((i) => (
              <div key={i} className="card">
                <div className="h-32 rounded-xl bg-white/5 border border-white/10 animate-pulse" />
                <div className="mt-4 h-4 w-2/3 bg-white/5 rounded animate-pulse" />
                <div className="mt-3 h-3 w-1/2 bg-white/5 rounded animate-pulse" />
              </div>
            ))
          ) : popularServices.length === 0 ? (
            <div className="card md:col-span-3">
              <p className="text-slate-300">No services available yet.</p>
              <p className="text-sm text-[#9CA3AF] mt-1">
                Check back soon or browse the catalog.
              </p>
              <div className="mt-4">
                <Link href="/buy-service" className="btn-primary">
                  Browse services
                </Link>
              </div>
            </div>
          ) : (
            popularServices.map((s) => (
              <Link
                key={s._id}
                href={`/services/${s._id}`}
                className="block group"
              >
                <div className="card cursor-pointer overflow-hidden">
                  <div className="relative">
                    <div className="h-36 rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/15 via-white/5 to-emerald-500/10 overflow-hidden">
                      {Array.isArray(s.images) && s.images[0] ? (
                        <img
                          src={s.images[0]}
                          alt={s.title}
                          className="h-36 w-full object-cover opacity-90 group-hover:opacity-100 transition"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-36 w-full flex items-center justify-center text-3xl text-white/70">
                          ✦
                        </div>
                      )}
                    </div>

                    <div className="absolute top-3 right-3">
                      <span className="px-3 py-1 rounded-full text-xs border border-emerald-500/25 bg-emerald-500/10 text-emerald-200 font-semibold">
                        ${s.price}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-lg font-semibold text-white truncate">
                        {s.title}
                      </h3>
                      <div className="mt-2 flex items-center gap-2 flex-wrap">
                        {s.category && (
                          <span className="u-pill text-slate-200">
                            {s.category}
                          </span>
                        )}
                        {s.deliveryType && (
                          <span className="u-pill text-slate-200">
                            {String(s.deliveryType).replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-300 mt-3 line-clamp-2">
                    {s.description || "Manual service delivered by UREMO."}
                  </p>
                </div>
              </Link>
            ))
          )}
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
          <p className="mt-2 text-xs text-[#9CA3AF]">
            Independent service provider. UREMO is not affiliated with, endorsed
            by, or sponsored by any third-party platforms referenced in service
            listings.
          </p>
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
