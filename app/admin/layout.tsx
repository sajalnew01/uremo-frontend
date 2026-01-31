"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AdminSupportNotifier from "@/components/admin/AdminSupportNotifier";
import Link from "next/link";

// PATCH_53: Tab structure for admin command center
const ADMIN_TABS = [
  { key: "orders", label: "Orders", href: "/admin" },
  { key: "tickets", label: "Tickets", href: "/admin/tickets" },
  { key: "workspace", label: "Workspace", href: "/admin/workspace" },
  { key: "finance", label: "Finance", href: "/admin/wallet" },
  { key: "content", label: "Content", href: "/admin/services" },
  { key: "settings", label: "Settings", href: "/admin/settings" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, isLoggedIn, isAdmin } = useAuth();

  useEffect(() => {
    if (!ready) return;
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    if (!isAdmin) router.replace("/dashboard");
  }, [ready, isLoggedIn, isAdmin, router]);

  if (!ready) {
    return <div className="p-6 text-slate-400">Loading...</div>;
  }

  if (!isLoggedIn || !isAdmin) {
    return <div className="p-6 text-slate-400">Redirecting...</div>;
  }

  // Determine active tab based on pathname
  const getActiveTab = () => {
    if (
      pathname === "/admin" ||
      pathname?.startsWith("/admin/orders") ||
      pathname?.startsWith("/admin/cancelled-orders")
    )
      return "orders";
    if (pathname?.startsWith("/admin/tickets")) return "tickets";
    if (
      pathname?.startsWith("/admin/workspace") ||
      pathname?.startsWith("/admin/proofs") ||
      pathname?.startsWith("/admin/work-positions") ||
      pathname?.startsWith("/admin/applications")
    )
      return "workspace";
    if (
      pathname?.startsWith("/admin/wallet") ||
      pathname?.startsWith("/admin/affiliate") ||
      pathname?.startsWith("/admin/payment-methods")
    )
      return "finance";
    if (
      pathname?.startsWith("/admin/services") ||
      pathname?.startsWith("/admin/blogs") ||
      pathname?.startsWith("/admin/faqs")
    )
      return "content";
    if (
      pathname?.startsWith("/admin/settings") ||
      pathname?.startsWith("/admin/jarvisx")
    )
      return "settings";
    return "orders"; // default
  };

  const activeTab = getActiveTab();

  // PATCH_53: Use the global app shell with tab navigation
  return (
    <>
      <AdminSupportNotifier />

      {/* Tab Navigation - Only show on main admin pages, not on analytics or other standalone pages */}
      {!pathname?.startsWith("/admin/analytics") &&
        pathname !== "/admin/rentals" &&
        pathname !== "/admin/service-requests" && (
          <div className="border-b border-white/10 bg-[#0a0f1c]/80 backdrop-blur sticky top-0 z-30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <nav
                className="flex space-x-1 overflow-x-auto"
                aria-label="Admin tabs"
              >
                {ADMIN_TABS.map((tab) => {
                  const isActive = activeTab === tab.key;
                  return (
                    <Link
                      key={tab.key}
                      href={tab.href}
                      className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                        isActive
                          ? "border-blue-500 text-blue-400"
                          : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-500"
                      }`}
                    >
                      {tab.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}

      {children}
    </>
  );
}
