"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/hooks/useSidebar";
import ProfileMenu from "@/components/ProfileMenu";
import {
  DEFAULT_PUBLIC_SITE_SETTINGS,
  useSiteSettings,
} from "@/hooks/useSiteSettings";

export default function Navbar() {
  const { ready, user, isAuthenticated, logout } = useAuth();
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const [logoFailed, setLogoFailed] = useState(false);
  const { data: settings } = useSiteSettings();

  const nav = settings?.nav || DEFAULT_PUBLIC_SITE_SETTINGS.nav;
  const site = settings?.site || DEFAULT_PUBLIC_SITE_SETTINGS.site;
  const supportEmail =
    settings?.support?.supportEmail ||
    DEFAULT_PUBLIC_SITE_SETTINGS.support.supportEmail;

  if (!ready) {
    return (
      <div className="px-6 py-4 border-b border-white/10" aria-busy="true" />
    );
  }

  return (
    <nav className="fixed top-0 inset-x-0 z-[9999] pointer-events-auto h-12 lg:h-14 border-b border-white/10 bg-black/10 backdrop-blur">
      <div className="h-12 lg:h-14 px-3 lg:px-6 flex items-center">
        <div className="flex items-center w-full">
          <div className="w-1/3 flex items-center">
            {isAuthenticated && (
              <button
                type="button"
                onClick={toggleSidebar}
                className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 hover:border-white/20"
                aria-label="Open menu"
              >
                <span className="text-lg">☰</span>
              </button>
            )}
          </div>

          <div className="w-1/3 flex justify-center min-w-0">
            <div className="flex items-center gap-5 min-w-0">
              <Link
                href="/"
                className="inline-flex items-center gap-2 min-w-0"
                aria-label="UREMO Home"
              >
                {!logoFailed ? (
                  <>
                    <Image
                      src="/brand/logo-mark.png"
                      alt={site.brandName || ""}
                      width={30}
                      height={30}
                      priority
                      className="lg:hidden"
                      onError={() => setLogoFailed(true)}
                    />
                    <Image
                      src="/brand/logo-full.png"
                      alt={site.brandName || ""}
                      width={120}
                      height={36}
                      priority
                      className="hidden lg:block"
                      onError={() => setLogoFailed(true)}
                    />
                  </>
                ) : (
                  <span className="text-lg md:text-xl font-bold truncate">
                    {site.brandName ||
                      DEFAULT_PUBLIC_SITE_SETTINGS.site.brandName}
                  </span>
                )}
              </Link>

              {isAuthenticated && (
                <div className="hidden lg:flex items-center gap-3 text-sm text-slate-200">
                  <Link
                    href="/dashboard"
                    className="hover:text-white/90 transition"
                  >
                    {nav.authedDashboardText}
                  </Link>
                  <Link
                    href="/buy-service"
                    className="hover:text-white/90 transition"
                  >
                    {nav.authedServicesText}
                  </Link>
                  <Link
                    href="/orders"
                    className="hover:text-white/90 transition"
                  >
                    {nav.authedOrdersText}
                  </Link>
                  <Link
                    href="/apply-to-work"
                    className="hover:text-white/90 transition"
                  >
                    {nav.authedApplyToWorkText}
                  </Link>
                  <a
                    href={`mailto:${supportEmail}`}
                    className="hover:text-white/90 transition"
                  >
                    {nav.supportLinkText}
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="w-1/3 flex gap-2 md:gap-3 items-center justify-end">
            {!isAuthenticated && pathname === "/" && (
              <>
                <Link href="/signup" className="btn-primary">
                  {nav.guestPrimaryCtaText}
                </Link>
                <Link href="/buy-service" className="btn-secondary">
                  {nav.guestSecondaryCtaText}
                </Link>
              </>
            )}

            {!isAuthenticated && pathname !== "/" && (
              <div className="flex items-center gap-3 text-sm text-slate-200">
                <Link href="/signup" className="hover:text-white/90 transition">
                  {nav.guestSignupText}
                </Link>
                <Link href="/login" className="hover:text-white/90 transition">
                  {nav.guestLoginText}
                </Link>
                <a
                  href={`mailto:${supportEmail}`}
                  className="hover:text-white/90 transition"
                >
                  {nav.supportLinkText}
                </a>
              </div>
            )}

            {isAuthenticated && <ProfileMenu />}
          </div>
        </div>
      </div>
    </nav>
  );
}
