"use client";

import Link from "next/link";

export default function AdminDashboard() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
      <p className="text-slate-400 mb-8">
        Manage services, payments, orders, and applications.
      </p>

      <div className="grid md:grid-cols-4 gap-6">
        <Link href="/admin/services">
          <div className="card cursor-pointer hover:border-white/20 transition">
            <h3 className="font-semibold">Services</h3>
            <p className="text-sm text-slate-400 mt-2">
              Add & manage marketplace services
            </p>
          </div>
        </Link>

        <Link href="/admin/orders">
          <div className="card cursor-pointer hover:border-white/20 transition">
            <h3 className="font-semibold">Orders</h3>
            <p className="text-sm text-slate-400 mt-2">
              Review payments & update status
            </p>
          </div>
        </Link>

        <Link href="/admin/payments">
          <div className="card cursor-pointer hover:border-white/20 transition">
            <h3 className="font-semibold">Payment Methods</h3>
            <p className="text-sm text-slate-400 mt-2">
              Control PayPal / Crypto details
            </p>
          </div>
        </Link>

        <Link href="/admin/applications">
          <div className="card cursor-pointer hover:border-white/20 transition">
            <h3 className="font-semibold">Applications</h3>
            <p className="text-sm text-slate-400 mt-2">
              Review work applications
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
