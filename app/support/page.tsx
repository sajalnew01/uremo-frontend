"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function SupportPage() {
  const whatsappNumber = (
    process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || ""
  ).trim();
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${encodeURIComponent(whatsappNumber)}`
    : "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="u-container max-w-2xl"
    >
      <div className="mb-12">
        <Link
          href="/dashboard"
          className="text-sm text-[#9CA3AF] hover:text-white transition"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="text-4xl font-bold mt-4 mb-2">Support</h1>
        <p className="text-slate-300">
          For issues, contact support or reply inside any order chat.
        </p>
      </div>

      {/* Support Options Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="card space-y-6 mb-8"
      >
        <div className="space-y-4">
          {/* Email Support */}
          <div className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition">
            <div className="flex items-start gap-4">
              <div className="text-2xl">📧</div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">Email Support</h3>
                <p className="text-sm text-slate-300 mb-3">
                  Send us an email for any questions or issues.
                </p>
                <a
                  href="mailto:support@uremo.online"
                  className="inline-flex items-center gap-2 text-sm text-emerald-300 hover:text-emerald-200 transition font-medium"
                >
                  support@uremo.online <span className="text-[#9CA3AF]">→</span>
                </a>
              </div>
            </div>
          </div>

          {/* WhatsApp Support - Optional, config-driven */}
          <div className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition">
            <div className="flex items-start gap-4">
              {whatsappNumber ? (
                <div className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition">
                  <div className="flex items-start gap-4">
                    <div className="text-2xl">💬</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white mb-1">
                        WhatsApp Support
                      </h3>
                      <p className="text-sm text-slate-300 mb-3">
                        Quick responses via WhatsApp.
                      </p>
                      <a
                        href={whatsappHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-emerald-300 hover:text-emerald-200 transition font-medium"
                      >
                        Contact via WhatsApp{" "}
                        <span className="text-[#9CA3AF]">→</span>
                      </a>
                    </div>
                  </div>
                </div>
              ) : null}
              <div className="text-2xl">💬</div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">
                  WhatsApp Support
                </h3>
                <p className="text-sm text-slate-300 mb-3">
                  Quick responses via WhatsApp (when available).
                </p>
                <button
                  type="button"
                  onClick={() => {
                    // Config-driven: open WhatsApp or show placeholder
                    window.open("https://wa.me/1234567890", "_blank");
                  }}
                  className="inline-flex items-center gap-2 text-sm text-emerald-300 hover:text-emerald-200 transition font-medium"
                >
                  Contact via WhatsApp <span className="text-[#9CA3AF]">→</span>
                </button>
              </div>
            </div>
          </div>

          {/* Order Chat */}
          <div className="p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition">
            <div className="flex items-start gap-4">
              <div className="text-2xl">💬</div>
              <div className="flex-1">
                <h3 className="font-semibold text-white mb-1">Order Chat</h3>
                <p className="text-sm text-slate-300 mb-3">
                  Have an active order? Message your specialist directly.
                </p>
                <Link
                  href="/orders"
                  className="inline-flex items-center gap-2 text-sm text-emerald-300 hover:text-emerald-200 transition font-medium"
                >
                  Go to my orders <span className="text-[#9CA3AF]">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/10"
      >
        <p className="text-sm text-blue-100">
          <span className="font-semibold">💡 Tip:</span> If your issue is tied
          to an order, replying inside the order chat is fastest—your specialist
          sees it immediately.
        </p>
      </motion.div>
    </motion.div>
  );
}
