"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const { ready, isLoggedIn, isAdmin, logout } = useAuth();

  if (!ready) {
    return (
      <div className="px-6 py-4 border-b border-white/10 text-slate-400">
        Loading...
      </div>
    );
  }

  return (
    <nav className="relative z-50 flex justify-between items-center px-6 py-4 border-b border-white/10">
      <Link href="/" className="text-xl font-bold">
        UREMO
      </Link>

      <div className="flex gap-4 items-center">
        {!isLoggedIn && (
          <>
            <Link href="/login">Login</Link>
            <Link href="/signup">Sign Up</Link>
          </>
        )}

        {isLoggedIn && (
          <>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/buy-service">Services</Link>
            <Link href="/orders">My Orders</Link>

            {isAdmin && (
              <>
                <Link href="/admin">Admin Panel</Link>
                <div className="flex gap-4 items-center">
                  <Link
                    href="/admin/services"
                    className="text-blue-400 hover:underline"
                  >
                    Admin → Services
                  </Link>

                  <Link
                    href="/admin/orders"
                    className="text-blue-400 hover:underline"
                  >
                    Admin → Orders
                  </Link>

                  <Link
                    href="/admin/payments"
                    className="text-blue-400 hover:underline"
                  >
                    Admin → Payments
                  </Link>
                </div>
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
