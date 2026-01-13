"use client";

import {
  DEFAULT_PUBLIC_SITE_SETTINGS,
  useSiteSettings,
} from "@/hooks/useSiteSettings";

export default function StatusBanner() {
  const { data } = useSiteSettings();
  const text =
    (data?.bannerText || "").trim() || DEFAULT_PUBLIC_SITE_SETTINGS.bannerText;

  return (
    <div className="bg-yellow-500/10 text-yellow-400 text-sm p-3 text-center">
      {text}
    </div>
  );
}
