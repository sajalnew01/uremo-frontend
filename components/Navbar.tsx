"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/hooks/useSidebar";

export default function Navbar() {
  const { ready, user, isAuthenticated, logout } = useAuth();
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();

  if (!ready) {
    return (
      <div className="px-6 py-4 border-b border-white/10 text-slate-400">
        Loading...
      </div>
    );
  }

  return (
    <nav className="fixed top-0 inset-x-0 z-[9999] pointer-events-auto h-14 border-b border-white/10 bg-black/10 backdrop-blur">
      <div className="h-14 px-4 md:px-6 flex items-center">
        <div className="flex items-center w-full">
          <div className="w-1/3 flex items-center">
            {isAuthenticated && (
              <button
                type="button"
                onClick={toggleSidebar}
                className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 hover:border-white/20"
                aria-label="Open menu"
              >
                <span className="text-lg">☰</span>
              </button>
            )}
          </div>

          <div className="w-1/3 flex justify-center min-w-0">
            <Link href="/" className="text-lg md:text-xl font-bold truncate">
              UREMO
            </Link>
          </div>

          <div className="w-1/3 flex gap-2 md:gap-3 items-center justify-end">
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
              <button
                onClick={logout}
                className="btn-secondary border-red-500/30 text-red-200 hover:border-red-500/50"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
