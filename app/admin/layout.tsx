"use client";

import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0F172A] border-r border-[#1F2937] p-4">
        <h2 className="text-lg font-bold mb-6">UREMO Admin</h2>

        <nav className="space-y-3 text-sm">
          <Link href="/admin" className="block text-[#E5E7EB]">
            Orders
          </Link>
          <Link href="/admin/apply-work" className="block text-[#E5E7EB]">
            Apply to Work
          </Link>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 bg-[#020617]">{children}</main>
    </div>
  );
}
