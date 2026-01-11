"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/components/SidebarContext";

export default function Navbar() {
  const { ready, user, isAuthenticated, logout } = useAuth();
  const { toggle } = useSidebar();
  const pathname = usePathname();

  if (!ready) {
    return (
      <div className="px-6 py-4 border-b border-white/10 text-slate-400">
        Loading...
      </div>
    );
  }

  return (
    <nav className="relative z-[9999] pointer-events-auto h-14 flex justify-between items-center px-4 md:px-6 border-b border-white/10 bg-black/10 backdrop-blur">
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
      <div className="flex gap-2 md:gap-3 items-center justify-end">
        {!isAuthenticated && pathname === "/" && (
          <>
            <Link href="/signup" className="btn-primary">
              Get Started
            </Link>
            <Link href="/buy-service" className="btn-secondary">
              Browse Services
            </Link>
          </>
        )}

        {!isAuthenticated && pathname !== "/" && (
          <div className="flex items-center gap-3 text-sm text-slate-200">
            <Link href="/signup" className="hover:text-white/90 transition">
              Sign up
            </Link>
            <Link href="/login" className="hover:text-white/90 transition">
              Login
            </Link>
          </div>
        )}

        {isAuthenticated && (
          <>
            {user?.role === "admin" && (
              <Link href="/admin" className="btn-secondary">
                Admin Panel
              </Link>
            )}
            <button
              onClick={logout}
              className="btn-secondary border-red-500/30 text-red-200 hover:border-red-500/50"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
