"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0F172A] border-r border-[#1F2937] p-4">
        <h2 className="text-lg font-bold mb-6">UREMO Admin</h2>

        <nav className="space-y-3 text-sm">
          <Link href="/admin" className="block text-[#E5E7EB]">
            Control Desk
          </Link>
          <Link href="/admin/orders" className="block text-[#E5E7EB]">
            Orders
          </Link>
          <Link href="/admin/services" className="block text-[#E5E7EB]">
            Services
          </Link>
          <Link href="/admin/payments" className="block text-[#E5E7EB]">
            Payments
          </Link>
          <Link href="/admin/applications" className="block text-[#E5E7EB]">
            Applications
          </Link>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 bg-[#020617]">{children}</main>
    </div>
  );
}
