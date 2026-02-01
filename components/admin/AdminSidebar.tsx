"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * PATCH_54B: Complete Admin Control Center Navigation
 *
 * Full navigation structure based on comprehensive backend analysis:
 * - Every admin route is mapped
 * - Grouped into logical categories for easy access
 * - Professional design with badges for pending items
 * - All features accessible: Orders, Tickets, Workspace, Jobs,
 *   Services, Rentals, Blogs, Wallets, Affiliates, Analytics, etc.
 */

type NavItem = {
  label: string;
  href: string;
  icon: string;
  badge?: string;
};

type NavGroup = {
  id: string;
  label: string;
  icon: string;
  description?: string;
  href?: string;
  items: NavItem[];
};

// Complete navigation structure based on ALL backend admin routes
const ADMIN_NAV_GROUPS: NavGroup[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "📊",
    href: "/admin",
    items: [],
  },
  {
    id: "orders",
    label: "Orders & Delivery",
    icon: "📦",
    description: "Manage all orders",
    items: [
      {
        label: "All Orders",
        href: "/admin/orders",
        icon: "📦",
        badge: "orders",
      },
      {
        label: "Cancelled Orders",
        href: "/admin/cancelled-orders",
        icon: "❌",
      },
      { label: "Rejected Orders", href: "/admin/rejected-orders", icon: "🚫" },
      {
        label: "Support Messages",
        href: "/admin/messages",
        icon: "💬",
        badge: "messages",
      },
    ],
  },
  {
    id: "support",
    label: "Support",
    icon: "🎫",
    description: "Help desk & tickets",
    items: [
      {
        label: "Support Tickets",
        href: "/admin/tickets",
        icon: "🎫",
        badge: "tickets",
      },
    ],
  },
  {
    id: "workspace",
    label: "Workspace",
    icon: "👷",
    description: "Workers & Projects",
    items: [
      { label: "Workspace Hub", href: "/admin/workspace", icon: "🏢" },
      { label: "All Workers", href: "/admin/workspace/workers", icon: "👷" },
      { label: "Projects", href: "/admin/workspace/projects", icon: "📋" },
      { label: "Screenings", href: "/admin/workspace/screenings", icon: "📝" },
      {
        label: "Proof Reviews",
        href: "/admin/proofs",
        icon: "✅",
        badge: "proofs",
      },
    ],
  },
  {
    id: "workforce",
    label: "Workforce",
    icon: "💼",
    description: "Jobs & Applications",
    items: [
      { label: "Work Positions", href: "/admin/work-positions", icon: "💼" },
      {
        label: "Job Applications",
        href: "/admin/applications",
        icon: "📄",
        badge: "applications",
      },
    ],
  },
  {
    id: "marketplace",
    label: "Marketplace",
    icon: "🏪",
    description: "Services & Content",
    items: [
      { label: "Services CMS", href: "/admin/services", icon: "🛠️" },
      {
        label: "Service Requests",
        href: "/admin/service-requests",
        icon: "📩",
      },
      { label: "Rentals", href: "/admin/rentals", icon: "🔑" },
      { label: "Blogs CMS", href: "/admin/blogs", icon: "📰" },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    icon: "💰",
    description: "Money & Affiliates",
    items: [
      { label: "User Wallets", href: "/admin/wallet", icon: "👛" },
      { label: "Affiliate Program", href: "/admin/affiliates", icon: "🤝" },
      { label: "Payment Methods", href: "/admin/payments", icon: "💳" },
      { label: "Payment Config", href: "/admin/payment-methods", icon: "⚙️" },
    ],
  },
  {
    id: "system",
    label: "System",
    icon: "🔧",
    description: "Settings & Tools",
    items: [
      { label: "Analytics", href: "/admin/analytics", icon: "📈" },
      { label: "JarvisX AI", href: "/admin/jarvisx", icon: "🤖" },
      { label: "Email Campaigns", href: "/admin/campaigns", icon: "📧" },
      { label: "Site Settings", href: "/admin/settings", icon: "⚙️" },
    ],
  },
];

interface BadgeCounts {
  orders?: number;
  tickets?: number;
  proofs?: number;
  applications?: number;
  messages?: number;
}

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [expandedGroups, setExpandedGroups] = useState<string[]>([
    "orders",
    "support",
    "workspace",
    "workforce",
    "marketplace",
    "finance",
    "system",
  ]);
  const [badges, setBadges] = useState<BadgeCounts>({});

  // Load badge counts on mount
  useEffect(() => {
    const loadBadges = async () => {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) return;

        const baseUrl =
          process.env.NEXT_PUBLIC_API_URL ||
          "https://uremo-backend.onrender.com";

        // Fetch pending counts in parallel
        const [ordersRes, ticketsRes, proofsRes] = await Promise.allSettled([
          fetch(`${baseUrl}/api/admin/orders`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${baseUrl}/api/admin/tickets`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${baseUrl}/api/admin/proofs`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const newBadges: BadgeCounts = {};

        if (ordersRes.status === "fulfilled" && ordersRes.value.ok) {
          const orders = await ordersRes.value.json();
          const pending = Array.isArray(orders)
            ? orders.filter(
                (o: any) =>
                  o.status === "pending" || o.status === "payment_pending",
              ).length
            : 0;
          if (pending > 0) newBadges.orders = pending;
        }

        if (ticketsRes.status === "fulfilled" && ticketsRes.value.ok) {
          const tickets = await ticketsRes.value.json();
          const open = tickets?.stats?.open || 0;
          if (open > 0) newBadges.tickets = open;
        }

        if (proofsRes.status === "fulfilled" && proofsRes.value.ok) {
          const proofs = await proofsRes.value.json();
          const pending =
            proofs?.proofs?.filter((p: any) => p.status === "pending")
              ?.length || 0;
          if (pending > 0) newBadges.proofs = pending;
        }

        setBadges(newBadges);
      } catch (err) {
        console.error("Failed to load badge counts:", err);
      }
    };

    loadBadges();
    // Refresh every 60 seconds
    const interval = setInterval(loadBadges, 60000);
    return () => clearInterval(interval);
  }, []);

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

  const isGroupActive = (group: NavGroup) => {
    if (group.href) {
      return isActiveLink(group.href);
    }
    return group.items.some((item) => isActiveLink(item.href));
  };

  const getBadgeCount = (badgeKey?: string): number | undefined => {
    if (!badgeKey) return undefined;
    return badges[badgeKey as keyof BadgeCounts];
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-gradient-to-b from-[#0a0f1c] to-[#0d1424] border-r border-white/10 z-50 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:z-auto overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0a0f1c]/80">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-bold text-lg">U</span>
            </div>
            <div>
              <span className="text-white font-bold text-lg">UREMO</span>
              <span className="text-xs text-blue-400 block -mt-0.5 font-medium">
                Admin Panel
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        {/* Navigation - Scrollable */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {ADMIN_NAV_GROUPS.map((group) => {
            const isExpanded = expandedGroups.includes(group.id);
            const isActive = isGroupActive(group);

            // Single link item (Dashboard)
            if (group.href && group.items.length === 0) {
              return (
                <Link
                  key={group.id}
                  href={group.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600/30 to-purple-600/20 text-white border border-blue-500/30 shadow-lg shadow-blue-500/10"
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="text-xl">{group.icon}</span>
                  <span className="font-semibold">{group.label}</span>
                </Link>
              );
            }

            // Group with items
            return (
              <div key={group.id} className="space-y-1">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? "bg-white/5 text-white"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{group.icon}</span>
                    <div className="text-left">
                      <span className="font-semibold text-sm">
                        {group.label}
                      </span>
                      {group.description && (
                        <span className="text-xs text-slate-500 block">
                          {group.description}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`text-xs transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  >
                    ▼
                  </span>
                </button>

                {isExpanded && (
                  <div className="ml-3 pl-4 border-l-2 border-white/10 space-y-0.5 py-1">
                    {group.items.map((item) => {
                      const itemActive = isActiveLink(item.href);
                      const badgeCount = getBadgeCount(item.badge);

                      return (
                        <Link
                          key={item.href + item.label}
                          href={item.href}
                          onClick={onClose}
                          className={`flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                            itemActive
                              ? "bg-blue-600/20 text-blue-400 border-l-2 border-blue-400 -ml-[2px] pl-[14px]"
                              : "text-slate-400 hover:bg-white/5 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{item.icon}</span>
                            <span>{item.label}</span>
                          </div>
                          {badgeCount !== undefined && badgeCount > 0 && (
                            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                              {badgeCount > 99 ? "99+" : badgeCount}
                            </span>
                          )}
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
        <div className="p-4 border-t border-white/10 bg-[#0a0f1c]/80 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition"
          >
            <span>←</span>
            <span>Back to User Dashboard</span>
          </Link>
          <div className="text-center text-xs text-slate-600">
            UREMO Admin v2.0
          </div>
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
      className="lg:hidden fixed top-4 left-4 z-30 p-3 bg-[#0a0f1c] border border-white/10 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition shadow-lg"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6h16M4 12h16M4 18h16"
        />
      </svg>
    </button>
  );
}
