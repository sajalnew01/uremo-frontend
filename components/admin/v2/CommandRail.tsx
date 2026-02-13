"use client";

/**
 * PATCH_63: MASTER ADMIN REBUILD
 * CommandRail - Operations-based navigation
 *
 * This replaces the old sidebar with a mission-critical operations rail.
 * Groups by WORKFLOWS, not features.
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  badge?: number;
  items?: {
    label: string;
    href: string;
    badge?: number;
    warning?: boolean;
  }[];
}

interface CommandRailProps {
  collapsed: boolean;
  onToggle: () => void;
  badges: {
    pendingOrders: number;
    pendingProofs: number;
    openTickets: number;
    pendingPayments: number;
    pendingApplications: number;
    stuckOrders: number;
    invalidScreenings: number;
    pendingWithdrawals: number;
  };
}

export default function CommandRail({
  collapsed,
  onToggle,
  badges,
}: CommandRailProps) {
  const pathname = usePathname();
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "master",
  );

  const totalUrgent =
    badges.pendingOrders +
    badges.pendingProofs +
    badges.openTickets +
    badges.pendingPayments +
    badges.stuckOrders +
    badges.invalidScreenings;

  const sections: NavSection[] = [
    {
      id: "master",
      label: "Action Queue",
      icon: <CommandIcon />,
      href: "/admin",
      badge: totalUrgent > 0 ? totalUrgent : undefined,
    },
    {
      id: "orders",
      label: "Orders & Delivery",
      icon: <OrdersIcon />,
      badge: badges.pendingOrders + badges.pendingPayments,
      items: [
        { label: "All Orders", href: "/admin/orders" },
        {
          label: "Payment Proofs",
          href: "/admin/orders/payments",
          badge: badges.pendingPayments,
        },
        {
          label: "Stuck Orders",
          href: "/admin/orders/stuck",
          badge: badges.stuckOrders,
          warning: badges.stuckOrders > 0,
        },
        { label: "Order Messages", href: "/admin/messages" },
      ],
    },
    {
      id: "workspace",
      label: "Worker Ops",
      icon: <WorkspaceIcon />,
      badge: badges.pendingProofs + badges.invalidScreenings,
      items: [
        { label: "Workspace Hub", href: "/admin/workspace/master" },
        { label: "Job Roles", href: "/admin/work-positions" },
        {
          label: "Screenings",
          href: "/admin/workspace/screenings",
          badge: badges.invalidScreenings,
          warning: badges.invalidScreenings > 0,
        },
        { label: "Workers", href: "/admin/workspace/workers" },
        { label: "Projects", href: "/admin/workspace/projects" },
        {
          label: "Proof Reviews",
          href: "/admin/proofs",
          badge: badges.pendingProofs,
        },
        { label: "RLHF Datasets", href: "/admin/datasets" },
        { label: "RLHF Reviews", href: "/admin/rlhf-reviews" },
      ],
    },
    {
      id: "workforce",
      label: "Hiring",
      icon: <WorkforceIcon />,
      badge: badges.pendingApplications,
      items: [
        {
          label: "Applications",
          href: "/admin/workforce",
          badge: badges.pendingApplications,
        },
        { label: "Positions", href: "/admin/work-positions/manage" },
        { label: "Screening Pipeline", href: "/admin/workforce/pipeline" },
      ],
    },
    {
      id: "support",
      label: "Support",
      icon: <SupportIcon />,
      badge: badges.openTickets,
      items: [
        { label: "Tickets", href: "/admin/tickets", badge: badges.openTickets },
        { label: "Order Disputes", href: "/admin/tickets?type=dispute" },
        { label: "Fraud Flags", href: "/admin/tickets?type=fraud" },
      ],
    },
    {
      id: "marketplace",
      label: "Marketplace",
      icon: <MarketplaceIcon />,
      items: [
        { label: "Services", href: "/admin/services" },
        { label: "Rentals", href: "/admin/rentals" },
        { label: "Service Requests", href: "/admin/service-requests" },
        { label: "Blogs", href: "/admin/blogs" },
      ],
    },
    {
      id: "finance",
      label: "Finance",
      icon: <FinanceIcon />,
      badge: badges.pendingWithdrawals,
      items: [
        { label: "Wallets", href: "/admin/wallet" },
        { label: "Payments", href: "/admin/payments" },
        { label: "Affiliates", href: "/admin/affiliates" },
        {
          label: "Withdrawals",
          href: "/admin/affiliates/withdrawals",
          badge: badges.pendingWithdrawals,
        },
      ],
    },
    {
      id: "system",
      label: "System",
      icon: <SystemIcon />,
      items: [
        { label: "Analytics", href: "/admin/analytics" },
        { label: "Campaigns", href: "/admin/campaigns" },
        { label: "JarvisX AI", href: "/admin/jarvisx" },
        { label: "Users", href: "/admin/users" },
        { label: "Settings", href: "/admin/settings" },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname?.startsWith(href);
  };

  const isSectionActive = (section: NavSection) => {
    if (section.href) return isActive(section.href);
    return section.items?.some((item) => isActive(item.href));
  };

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-[#0a0d14] border-r border-white/5 
                  transition-all duration-300 z-50 flex flex-col
                  ${collapsed ? "w-16" : "w-64"}`}
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-3 border-b border-white/5">
        {!collapsed && (
          <span className="text-white font-bold text-lg tracking-tight">
            UREMO
          </span>
        )}
        <button
          onClick={onToggle}
          className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          {collapsed ? "→" : "←"}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        {sections.map((section) => (
          <div key={section.id} className="mb-1">
            {section.href ? (
              // Direct link section (Master Workspace)
              <Link
                href={section.href}
                className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-all
                           ${
                             isSectionActive(section)
                               ? "bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white border border-blue-500/30"
                               : "text-slate-400 hover:bg-white/5 hover:text-white"
                           }`}
              >
                <span className="w-5 h-5 flex-shrink-0">{section.icon}</span>
                {!collapsed && (
                  <>
                    <span className="flex-1 font-medium text-sm">
                      {section.label}
                    </span>
                    {section.badge && section.badge > 0 && (
                      <span className="px-1.5 py-0.5 text-xs font-bold rounded bg-red-500 text-white">
                        {section.badge}
                      </span>
                    )}
                  </>
                )}
                {collapsed && section.badge && section.badge > 0 && (
                  <span className="absolute left-10 top-0 w-4 h-4 text-[10px] font-bold rounded-full bg-red-500 text-white flex items-center justify-center">
                    {section.badge > 9 ? "9+" : section.badge}
                  </span>
                )}
              </Link>
            ) : (
              // Expandable section
              <>
                <button
                  onClick={() =>
                    setExpandedSection(
                      expandedSection === section.id ? null : section.id,
                    )
                  }
                  className={`w-full flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-all
                             ${
                               isSectionActive(section)
                                 ? "bg-white/10 text-white"
                                 : "text-slate-400 hover:bg-white/5 hover:text-white"
                             }`}
                  style={{ width: collapsed ? "48px" : "calc(100% - 16px)" }}
                >
                  <span className="w-5 h-5 flex-shrink-0 relative">
                    {section.icon}
                    {collapsed && section.badge && section.badge > 0 && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 text-[8px] font-bold rounded-full bg-red-500 text-white flex items-center justify-center">
                        {section.badge > 9 ? "!" : section.badge}
                      </span>
                    )}
                  </span>
                  {!collapsed && (
                    <>
                      <span className="flex-1 font-medium text-sm text-left">
                        {section.label}
                      </span>
                      {section.badge && section.badge > 0 && (
                        <span className="px-1.5 py-0.5 text-xs font-bold rounded bg-red-500/80 text-white mr-1">
                          {section.badge}
                        </span>
                      )}
                      <span
                        className={`text-xs transition-transform ${expandedSection === section.id ? "rotate-90" : ""}`}
                      >
                        ▶
                      </span>
                    </>
                  )}
                </button>

                {/* Sub-items */}
                {!collapsed &&
                  expandedSection === section.id &&
                  section.items && (
                    <div className="ml-5 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                      {section.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all
                                   ${
                                     isActive(item.href)
                                       ? "bg-blue-500/20 text-blue-400"
                                       : item.warning
                                         ? "text-amber-400 hover:bg-amber-500/10"
                                         : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
                                   }`}
                        >
                          <span className="flex-1">{item.label}</span>
                          {item.badge !== undefined && item.badge > 0 && (
                            <span
                              className={`px-1.5 py-0.5 text-xs font-bold rounded 
                                           ${item.warning ? "bg-amber-500/20 text-amber-400" : "bg-blue-500/20 text-blue-400"}`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
              </>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/5">
        {!collapsed && (
          <div className="text-xs text-slate-600 text-center">
            UREMO Admin v2.0
          </div>
        )}
      </div>
    </div>
  );
}

// Icons (inline SVG for performance)
function CommandIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-full h-full"
    >
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-full h-full"
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function WorkspaceIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-full h-full"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  );
}

function WorkforceIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-full h-full"
    >
      <circle cx="9" cy="7" r="4" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      <path d="M21 21v-2a4 4 0 0 0-3-3.85" />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-full h-full"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <circle cx="12" cy="17" r="1" />
    </svg>
  );
}

function MarketplaceIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-full h-full"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function FinanceIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-full h-full"
    >
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="w-full h-full"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
