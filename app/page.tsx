"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/api";
import { withCacheBust } from "@/lib/cacheBust";
import {
  DEFAULT_PUBLIC_SITE_SETTINGS,
  useSiteSettings,
} from "@/hooks/useSiteSettings";
// PATCH_21: Listen for services:refresh to update homepage in real-time
import { onServicesRefresh } from "@/lib/events";

type Service = {
  _id: string;
  title: string;
  description?: string;
  category?: string;
  price: number;
  currency?: string;
  deliveryType?: string;
  images?: string[];
  imageUrl?: string;
  updatedAt?: string;
  active?: boolean;
};

export default function LandingPage() {
  const router = useRouter();
  const { ready, isAuthenticated } = useAuth();
  const { data: settings } = useSiteSettings();

  const landing = settings?.landing || DEFAULT_PUBLIC_SITE_SETTINGS.landing;

  const [services, setServices] = useState<Service[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);

  // PATCH_21: Memoized fetch function for reuse
  const fetchServices = useCallback(async () => {
    setServicesLoading(true);
    try {
      const data = await apiRequest<Service[]>("/api/services");
      setServices(Array.isArray(data) ? data : []);
    } catch {
      setServices([]);
    } finally {
      setServicesLoading(false);
    }
  }, []);

  useEffect(() => {
    // Redirect logged-in users to dashboard
    if (ready && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [ready, isAuthenticated, router]);

  // PATCH_21: Initial fetch
  useEffect(() => {
    if (!ready || isAuthenticated) return;
    fetchServices();
  }, [ready, isAuthenticated, fetchServices]);

  // PATCH_21: Listen for services:refresh events to update in real-time
  useEffect(() => {
    if (!ready || isAuthenticated) return;
    const cleanup = onServicesRefresh(() => {
      fetchServices();
    });
    return cleanup;
  }, [ready, isAuthenticated]);

  const popularServices = useMemo(() => {
    const list = Array.isArray(services) ? services : [];
    // Prefer active services; keep stable ordering.
    const activeFirst = list
      .slice()
      .sort((a, b) => Number(Boolean(b.active)) - Number(Boolean(a.active)));
    return activeFirst.slice(0, 3);
  }, [services]);

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
          {landing.heroTitle}
        </h1>
        <p className="text-base md:text-xl text-slate-300 max-w-2xl mx-auto mb-10">
          {landing.heroSubtitle}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/buy-service">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="btn-primary w-full sm:w-auto"
            >
              {landing.ctaPrimaryText}
            </motion.button>
          </Link>
          <Link href="/signup">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn-secondary w-full sm:w-auto"
            >
              {landing.ctaSecondaryText}
            </motion.button>
          </Link>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-3 text-left">
          {landing.features.map((f) => (
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
            {landing.supportedServicesTitle}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 justify-center">
            {landing.supportedServicesTags.map((tag) => (
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
          {landing.howItWorksTitle}
        </h2>

        <div className="grid md:grid-cols-4 gap-6">
          {landing.howItWorksSteps.map((item) => (
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
            <h2 className="text-3xl font-bold">{landing.popularTitle}</h2>
            <p className="text-slate-300 mt-2 max-w-2xl">
              {landing.popularSubtitle}
            </p>
          </div>
          <Link href="/buy-service" className="btn-secondary px-4 py-2 text-sm">
            {landing.popularBrowseAllText}
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 overflow-x-hidden">
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
              <p className="text-slate-300">{landing.popularEmptyTitle}</p>
              <p className="text-sm text-[#9CA3AF] mt-1">
                {landing.popularEmptySubtitle}
              </p>
              <div className="mt-4">
                <Link href="/buy-service" className="btn-primary">
                  {landing.popularEmptyCtaText}
                </Link>
              </div>
            </div>
          ) : (
            popularServices.map((s) => (
              <Link
                key={s._id}
                href={`/services/${s._id}`}
                className="block group h-full"
              >
                <div className="card cursor-pointer overflow-hidden h-full flex flex-col">
                  <div className="relative">
                    <div className="aspect-video w-full rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/15 via-white/5 to-emerald-500/10 overflow-hidden">
                      {s.imageUrl ||
                      (Array.isArray(s.images) && s.images[0]) ? (
                        <img
                          src={withCacheBust(
                            s.imageUrl || s.images?.[0],
                            s.updatedAt || s._id,
                          )}
                          alt={s.title}
                          className="h-full w-full object-cover opacity-90 group-hover:opacity-100 transition"
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-3xl text-white/70">
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
                      <h3 className="text-lg font-semibold text-white line-clamp-2">
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

                  <p className="text-sm text-slate-300 mt-3 line-clamp-3 flex-1">
                    {s.description ||
                      settings?.services?.trustBlockText ||
                      DEFAULT_PUBLIC_SITE_SETTINGS.services.trustBlockText}
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
          <h2 className="text-2xl md:text-3xl font-bold">
            {landing.finalCtaTitle}
          </h2>
          <p className="text-slate-300 mt-3 max-w-2xl mx-auto">
            {landing.finalCtaSubtitle}
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/signup" className="btn-primary">
              {landing.finalCtaPrimaryText}
            </Link>
            <Link href="/buy-service" className="btn-secondary">
              {landing.finalCtaSecondaryText}
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
          {landing.whyChooseTitle}
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          {landing.whyChooseFeatures.map((feat) => (
            <motion.div
              key={feat.title}
              whileHover={{ scale: 1.02 }}
              className="card"
            >
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
            {landing.trustDisclaimerText}
          </p>
        </div>
      </motion.section>
    </div>
  );
}
