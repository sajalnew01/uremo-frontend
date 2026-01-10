"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/components/SidebarContext";

export default function Navbar() {
  const { ready, user, isAuthenticated, logout } = useAuth();
  const { toggle } = useSidebar();

  if (!ready) {
    return (
      <div className="px-6 py-4 border-b border-white/10 text-slate-400">
        Loading...
      </div>
    );
  }

  return (
    <nav className="relative z-[9999] pointer-events-auto flex justify-between items-center px-4 md:px-6 py-4 border-b border-white/10">
      <div className="flex items-center gap-3 min-w-0">
        {isAuthenticated && (
          <button
            type="button"
            onClick={toggle}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded border border-white/10 hover:border-white/20"
            aria-label="Open menu"
          >
            <span className="text-lg">☰</span>
          </button>
        )}

        <Link href="/" className="text-xl font-bold truncate">
          UREMO
        </Link>
      </div>
      <div className="flex gap-3 md:gap-4 items-center flex-wrap justify-end">
        {!isAuthenticated && (
          <>
            <Link href="/login">Login</Link>
            <Link href="/signup">Sign Up</Link>
            <Link href="/buy-service">Services</Link>
          </>
        )}

        {isAuthenticated && (
          <>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/buy-service">Buy Service</Link>
            <Link href="/orders">My Orders</Link>
            <Link href="/apply-to-work">Apply to Work</Link>

            {user?.role === "admin" && (
              <>
                <Link href="/admin">Admin</Link>
                <Link
                  href="/admin/services"
                  className="text-blue-400 hover:underline"
                >
                  Services
                </Link>
                <Link
                  href="/admin/orders"
                  className="text-blue-400 hover:underline"
                >
                  Orders
                </Link>
                <Link
                  href="/admin/payments"
                  className="text-blue-400 hover:underline"
                >
                  Payments
                </Link>
                <Link
                  href="/admin/applications"
                  className="text-blue-400 hover:underline"
                >
                  Applications
                </Link>
              </>
            )}

            <button onClick={logout} className="text-red-400">
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
