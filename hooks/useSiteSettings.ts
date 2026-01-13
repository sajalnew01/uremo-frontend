"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequest } from "@/lib/api";

export type FaqItem = { q: string; a: string };

export type PublicSiteSettings = {
  bannerText: string;
  support: { whatsappNumber: string; supportEmail: string };
  footer: { disclaimer: string; dataSafetyNote: string };
  faq: {
    global: FaqItem[];
    payment: FaqItem[];
    applyWork: FaqItem[];
    orderSupport: FaqItem[];
  };
};

export const DEFAULT_PUBLIC_SITE_SETTINGS: PublicSiteSettings = {
  bannerText:
    "⚠️ All services are processed manually. Verification & approval may take time.",
  support: {
    whatsappNumber: "",
    supportEmail: "support@uremo.online",
  },
  footer: {
    disclaimer:
      "UREMO is an independent service provider. We are not affiliated with, endorsed by, or sponsored by any third-party platforms.",
    dataSafetyNote:
      "Verification outcomes depend on platform rules and policies. UREMO does not store sensitive login credentials or personal data openly.",
  },
  faq: {
    global: [],
    payment: [
      {
        q: "How long does verification take?",
        a: "Usually 5–60 minutes. During peak time it may take longer.",
      },
      {
        q: "What proof is accepted?",
        a: "Screenshot/PDF with transaction ID, amount, and receiver details.",
      },
      {
        q: "What if I uploaded wrong proof?",
        a: "Message Support using Order Chat and re-upload if needed.",
      },
    ],
    applyWork: [
      {
        q: "How long does approval take?",
        a: "24–72 hours depending on openings.",
      },
      {
        q: "What resume format is accepted?",
        a: "PDF is preferred.",
      },
    ],
    orderSupport: [
      {
        q: "How do I get faster delivery?",
        a: "Use the Order Support Chat and share your order issue.",
      },
    ],
  },
};

let cached: PublicSiteSettings | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 60_000;

const normalizeFaq = (value: unknown): FaqItem[] => {
  if (!Array.isArray(value)) return [];
  const out: FaqItem[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const q = String((item as any).q || "").trim();
    const a = String((item as any).a || "").trim();
    if (!q || !a) continue;
    out.push({ q, a });
    if (out.length >= 25) break;
  }
  return out;
};

const mergeWithDefaults = (input: any): PublicSiteSettings => {
  const bannerText = String(input?.bannerText || "").trim();
  const supportEmail = String(input?.support?.supportEmail || "").trim();
  const whatsappNumber = String(input?.support?.whatsappNumber || "").trim();
  const disclaimer = String(input?.footer?.disclaimer || "").trim();
  const dataSafetyNote = String(input?.footer?.dataSafetyNote || "").trim();

  const globalFaq = normalizeFaq(input?.faq?.global);
  const paymentFaq = normalizeFaq(input?.faq?.payment);
  const applyWorkFaq = normalizeFaq(input?.faq?.applyWork);
  const orderSupportFaq = normalizeFaq(input?.faq?.orderSupport);

  return {
    bannerText: bannerText || DEFAULT_PUBLIC_SITE_SETTINGS.bannerText,
    support: {
      whatsappNumber:
        whatsappNumber || DEFAULT_PUBLIC_SITE_SETTINGS.support.whatsappNumber,
      supportEmail: supportEmail || DEFAULT_PUBLIC_SITE_SETTINGS.support.supportEmail,
    },
    footer: {
      disclaimer: disclaimer || DEFAULT_PUBLIC_SITE_SETTINGS.footer.disclaimer,
      dataSafetyNote:
        dataSafetyNote || DEFAULT_PUBLIC_SITE_SETTINGS.footer.dataSafetyNote,
    },
    faq: {
      global: globalFaq.length ? globalFaq : DEFAULT_PUBLIC_SITE_SETTINGS.faq.global,
      payment: paymentFaq.length
        ? paymentFaq
        : DEFAULT_PUBLIC_SITE_SETTINGS.faq.payment,
      applyWork: applyWorkFaq.length
        ? applyWorkFaq
        : DEFAULT_PUBLIC_SITE_SETTINGS.faq.applyWork,
      orderSupport: orderSupportFaq.length
        ? orderSupportFaq
        : DEFAULT_PUBLIC_SITE_SETTINGS.faq.orderSupport,
    },
  };
};

export function useSiteSettings() {
  const [data, setData] = useState<PublicSiteSettings>(
    cached || DEFAULT_PUBLIC_SITE_SETTINGS
  );
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setError(null);
      const raw = await apiRequest("/api/settings/public", "GET");
      const merged = mergeWithDefaults(raw);
      cached = merged;
      cachedAt = Date.now();
      setData(merged);
    } catch (e: any) {
      setError(e?.message || "Failed to load settings");
      // Keep UI stable
      setData(cached || DEFAULT_PUBLIC_SITE_SETTINGS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fresh = cached && Date.now() - cachedAt < CACHE_TTL_MS;
    if (fresh) {
      setLoading(false);
      setData(cached || DEFAULT_PUBLIC_SITE_SETTINGS);
      return;
    }

    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return useMemo(
    () => ({ data, loading, error, refresh }),
    [data, loading, error]
  );
}
