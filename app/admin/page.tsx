"use client";

import Link from "next/link";

const adminModules = [
  {
    title: "Services",
    description: "Add & manage marketplace services",
    href: "/admin/services",
    icon: "📋",
    gradient: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/30",
    hoverBorder: "hover:border-blue-500/50",
  },
  {
    title: "Orders",
    description: "Review payments & update order status",
    href: "/admin/orders",
    icon: "📦",
    gradient: "from-purple-500/20 to-pink-500/20",
    borderColor: "border-purple-500/30",
    hoverBorder: "hover:border-purple-500/50",
  },
  // PATCH_22: Rentals management
  {
    title: "Rentals",
    description: "Manage rental subscriptions & access",
    href: "/admin/rentals",
    icon: "🔄",
    gradient: "from-violet-500/20 to-purple-500/20",
    borderColor: "border-violet-500/30",
    hoverBorder: "hover:border-violet-500/50",
  },
  {
    title: "Service Requests",
    description: "Leads captured from JarvisX Support",
    href: "/admin/service-requests",
    icon: "🧾",
    gradient: "from-emerald-500/20 to-teal-500/20",
    borderColor: "border-emerald-500/30",
    hoverBorder: "hover:border-emerald-500/50",
  },
  {
    title: "Payment Methods",
    description: "Control PayPal / Crypto payment details",
    href: "/admin/payment-methods",
    icon: "💳",
    gradient: "from-green-500/20 to-emerald-500/20",
    borderColor: "border-green-500/30",
    hoverBorder: "hover:border-green-500/50",
  },
  {
    title: "Applications",
    description: "Review work applications from users",
    href: "/admin/applications",
    icon: "📝",
    gradient: "from-orange-500/20 to-amber-500/20",
    borderColor: "border-orange-500/30",
    hoverBorder: "hover:border-orange-500/50",
  },
  {
    title: "Work Positions",
    description: "Manage open positions & requirements",
    href: "/admin/work-positions",
    icon: "👥",
    gradient: "from-indigo-500/20 to-violet-500/20",
    borderColor: "border-indigo-500/30",
    hoverBorder: "hover:border-indigo-500/50",
  },
  {
    title: "Blogs",
    description: "Create & manage blog posts",
    href: "/admin/blogs",
    icon: "📝",
    gradient: "from-fuchsia-500/20 to-pink-500/20",
    borderColor: "border-fuchsia-500/30",
    hoverBorder: "hover:border-fuchsia-500/50",
  },
  {
    title: "CMS Settings",
    description: "Site branding, SEO & configuration",
    href: "/admin/settings",
    icon: "⚙️",
    gradient: "from-slate-500/20 to-zinc-500/20",
    borderColor: "border-slate-500/30",
    hoverBorder: "hover:border-slate-500/50",
  },
  {
    title: "JarvisX Chat",
    description: "AI assistant configuration",
    href: "/admin/jarvisx",
    icon: "🤖",
    gradient: "from-rose-500/20 to-red-500/20",
    borderColor: "border-rose-500/30",
    hoverBorder: "hover:border-rose-500/50",
  },
  {
    title: "JarvisX Write",
    description: "Content generation settings",
    href: "/admin/jarvisx-write",
    icon: "✍️",
    gradient: "from-teal-500/20 to-cyan-500/20",
    borderColor: "border-teal-500/30",
    hoverBorder: "hover:border-teal-500/50",
  },
];

export default function AdminDashboard() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">⚡</span>
          <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            Admin Panel
          </h1>
        </div>
        <p className="text-slate-400 text-lg max-w-2xl">
          Manage your platform&apos;s services, orders, payments, and team
          applications from one central dashboard.
        </p>
      </div>

      {/* Quick Stats - Optional enhancement */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20">
          <p className="text-2xl font-bold text-white">—</p>
          <p className="text-sm text-slate-400">Active Services</p>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20">
          <p className="text-2xl font-bold text-white">—</p>
          <p className="text-sm text-slate-400">Pending Orders</p>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20">
          <p className="text-2xl font-bold text-white">—</p>
          <p className="text-sm text-slate-400">Total Revenue</p>
        </div>
        <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border border-orange-500/20">
          <p className="text-2xl font-bold text-white">—</p>
          <p className="text-sm text-slate-400">New Applications</p>
        </div>
      </div>

      {/* Admin Modules Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {adminModules.map((module) => (
          <Link key={module.href} href={module.href}>
            <div
              className={`group p-6 rounded-2xl bg-gradient-to-br ${module.gradient} border ${module.borderColor} ${module.hoverBorder} transition-all duration-300 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-1 cursor-pointer h-full`}
            >
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">
                {module.icon}
              </div>
              <h3 className="font-semibold text-lg text-white mb-2">
                {module.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {module.description}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Help Section */}
      <div className="mt-12 p-6 rounded-2xl bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-white/10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="text-3xl">💡</div>
          <div className="flex-1">
            <h3 className="font-semibold text-white mb-1">Need Help?</h3>
            <p className="text-sm text-slate-400">
              Check out the documentation or contact support for assistance with
              any admin features.
            </p>
          </div>
          <Link
            href="/support"
            className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-sm font-medium transition-all"
          >
            Get Support
          </Link>
        </div>
      </div>
    </div>
  );
}
