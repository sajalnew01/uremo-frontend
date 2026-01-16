"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import AdminSupportNotifier from "@/components/admin/AdminSupportNotifier";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
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

  // Use the global app shell (Navbar + Sidebar). This layout only enforces the admin guard.
  return (
    <>
      <AdminSupportNotifier />
      {children}
    </>
  );
}
