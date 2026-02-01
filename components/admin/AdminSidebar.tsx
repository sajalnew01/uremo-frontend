"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * PATCH_54: Admin Control Center Navigation Structure
 * Organized into logical groups:
 * - Dashboard
 * - Operations (Orders, Proofs, Tickets, Applications, Workers)
 * - Marketplace (Services, Deals, Rentals, Blogs)
 * - Workforce (Work Positions, Screenings, Projects)
 * - Finance (Payments, Wallets, Affiliates)
 * - System (Analytics, JarvisX, Campaigns, Settings)
 */

const ADMIN_NAV_GROUPS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "🏠",
    href: "/admin",
    items: [],
  },
  {
    id: "operations",
    label: "Operations",
    icon: "⚙️",
    items: [
      { label: "Orders", href: "/admin/orders", icon: "📦" },
      { label: "Proofs", href: "/admin/proofs", icon: "✅" },
      { label: "Tickets", href: "/admin/tickets", icon: "🎫" },
      { label: "Applications", href: "/admin/applications", icon: "📋" },
      { label: "Workers", href: "/admin/workspace", icon: "👷" },
    ],
  },
  {
    id: "marketplace",
    label: "Marketplace",
    icon: "🏪",
    items: [
      { label: "Services", href: "/admin/services", icon: "🛠️" },
      {
        label: "Service Requests",
        href: "/admin/service-requests",
        icon: "📝",
      },
      { label: "Rentals", href: "/admin/rentals", icon: "🏠" },
      { label: "Blogs", href: "/admin/blogs", icon: "📰" },
    ],
  },
  {
    id: "workforce",
    label: "Workforce",
    icon: "👥",
    items: [
      { label: "Work Positions", href: "/admin/work-positions", icon: "💼" },
      {
        label: "Work Applications",
        href: "/admin/work-applications",
        icon: "📄",
      },
      { label: "Projects", href: "/admin/workspace", icon: "📁" },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    icon: "💰",
    items: [
      { label: "Payments", href: "/admin/payments", icon: "💳" },
      { label: "Wallets", href: "/admin/wallet", icon: "👛" },
      { label: "Affiliates", href: "/admin/affiliates", icon: "🤝" },
      { label: "Payment Methods", href: "/admin/payment-methods", icon: "🏦" },
    ],
  },
  {
    id: "system",
    label: "System",
    icon: "🔧",
    items: [
      { label: "Analytics", href: "/admin/analytics", icon: "📊" },
      { label: "JarvisX", href: "/admin/jarvisx", icon: "🤖" },
      { label: "Campaigns", href: "/admin/campaigns", icon: "📢" },
      { label: "Settings", href: "/admin/settings", icon: "⚙️" },
    ],
  },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([
    "operations",
    "marketplace",
    "finance",
    "system",
    "workforce",
  ]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId],
    );
  };

  const isActiveLink = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname?.startsWith(href);
  };

  const isGroupActive = (group: (typeof ADMIN_NAV_GROUPS)[0]) => {
    if (group.href) {
      return isActiveLink(group.href);
    }
    return group.items.some((item) => isActiveLink(item.href));
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#0a0f1c] border-r border-white/10 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:z-auto overflow-y-auto`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">U</span>
            </div>
            <div>
              <span className="text-white font-semibold">UREMO</span>
              <span className="text-xs text-slate-400 block -mt-1">
                Admin Panel
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1 text-slate-400 hover:text-white text-xl"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 pb-20">
          {ADMIN_NAV_GROUPS.map((group) => {
            const isExpanded = expandedGroups.includes(group.id);
            const isActive = isGroupActive(group);

            // Single link (Dashboard)
            if (group.href && group.items.length === 0) {
              return (
                <Link
                  key={group.id}
                  href={group.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-blue-600/20 text-blue-400"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span>{group.icon}</span>
                  <span className="font-medium">{group.label}</span>
                </Link>
              );
            }

            // Group with items
            return (
              <div key={group.id} className="space-y-1">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? "bg-white/5 text-white"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span>{group.icon}</span>
                    <span className="font-medium text-sm uppercase tracking-wider">
                      {group.label}
                    </span>
                  </div>
                  <span className="text-xs">{isExpanded ? "▼" : "▶"}</span>
                </button>

                {isExpanded && (
                  <div className="ml-4 pl-3 border-l border-white/10 space-y-0.5">
                    {group.items.map((item) => {
                      const itemActive = isActiveLink(item.href);

                      return (
                        <Link
                          key={item.href + item.label}
                          href={item.href}
                          onClick={onClose}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            itemActive
                              ? "bg-blue-600/20 text-blue-400"
                              : "text-slate-400 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-[#0a0f1c]">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <span>←</span>
            <span>Back to User Dashboard</span>
          </Link>
        </div>
      </aside>
    </>
  );
}

// Mobile Menu Button Component
export function AdminMobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden fixed top-4 left-4 z-30 p-2 bg-[#0a0f1c] border border-white/10 rounded-lg text-slate-300 hover:text-white text-xl"
    >
      ☰
    </button>
  );
}
