"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AdminSupportNotifier from "@/components/admin/AdminSupportNotifier";
import AdminSidebar, {
  AdminMobileMenuButton,
} from "@/components/admin/AdminSidebar";

/**
 * PATCH_54: Admin Control Center Redesign
 * New sidebar-based navigation with grouped categories:
 * - Dashboard
 * - Operations (Orders, Proofs, Tickets, Applications, Workers)
 * - Marketplace (Services, Deals, Rentals, Blogs)
 * - Workforce (Work Positions, Screenings, Projects)
 * - Finance (Payments, Wallets, Affiliates)
 * - System (Analytics, JarvisX, CMS, Campaigns, Settings)
 */

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, isLoggedIn, isAdmin } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!ready) return;
    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    if (!isAdmin) router.replace("/dashboard");
  }, [ready, isLoggedIn, isAdmin, router]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#050810] flex items-center justify-center">
        <div className="text-slate-400">Redirecting...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050810] flex">
      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 lg:ml-0">
        {/* Mobile Menu Button */}
        <AdminMobileMenuButton onClick={() => setSidebarOpen(true)} />

        {/* Support Notifier */}
        <AdminSupportNotifier />

        {/* Page Content */}
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  );
}
