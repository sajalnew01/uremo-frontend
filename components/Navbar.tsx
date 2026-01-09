"use client";

import Link from "next/link";
import { isLoggedIn, isAdmin } from "@/lib/auth";

export default function Navbar() {
  const loggedIn = isLoggedIn();
  const admin = isAdmin();

  return (
    <nav className="flex justify-between items-center px-6 py-4 border-b border-white/10">
      <Link href="/" className="text-xl font-bold">
        UREMO
      </Link>

      <div className="flex gap-4">
        {!loggedIn && (
          <>
            <Link href="/login">Login</Link>
            <Link href="/signup">Sign Up</Link>
          </>
        )}

        {loggedIn && (
          <>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/buy-service">Services</Link>
            <Link href="/orders">My Orders</Link>

            {admin && (
              <>
                <Link href="/admin">Admin Panel</Link>
                <Link href="/admin/services" className="text-blue-400">
                  Admin → Services
                </Link>
                <Link href="/admin/orders" className="text-blue-400">
                  Admin → Orders
                </Link>
                <Link href="/admin/payment-methods" className="text-blue-400">
                  Admin → Payments
                </Link>
              </>
            )}

            <button
              onClick={() => {
                localStorage.clear();
                window.location.href = "/login";
              }}
              className="text-red-400"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
