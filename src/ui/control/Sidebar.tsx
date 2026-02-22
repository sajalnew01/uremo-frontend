"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useEffect, useMemo } from "react";
import { useAuthStore, useUIStore } from "@/store";

type NavItem = { label: string; href: string };

type NavSection = {
  title: string;
  icon: string;
  adminOnly?: boolean;
  items: NavItem[];
};

const SECTIONS: NavSection[] = [
  {
    title: "Marketplace",
    icon: "◈",
    items: [
      { label: "Browse", href: "/marketplace" },
      { label: "Orders", href: "/marketplace/orders" },
      { label: "Rentals", href: "/marketplace/rentals" },
    ],
  },
  {
    title: "Workforce",
    icon: "⚙",
    items: [
      { label: "Dashboard", href: "/workforce" },
      { label: "Earnings", href: "/workforce/earnings" },
    ],
  },
  {
    title: "Finance",
    icon: "◇",
    items: [
      { label: "Wallet", href: "/finance/wallet" },
      { label: "Transactions", href: "/finance/transactions" },
      { label: "Withdrawals", href: "/finance/withdrawals" },
    ],
  },
  {
    title: "Admin",
    icon: "⬡",
    adminOnly: true,
    items: [
      { label: "Services", href: "/admin/services" },
      { label: "Orders", href: "/admin/orders" },
      { label: "Rentals", href: "/admin/rentals" },
      { label: "Workforce", href: "/admin/workforce" },
      { label: "Screenings", href: "/admin/screenings" },
      { label: "Projects", href: "/admin/projects" },
      { label: "Wallet", href: "/admin/wallet" },
      { label: "Finance", href: "/admin/finance" },
      { label: "Users", href: "/admin/users" },
      { label: "Tickets", href: "/admin/tickets" },
      { label: "Blogs", href: "/admin/blogs" },
      { label: "Datasets", href: "/admin/datasets" },
      { label: "Analytics", href: "/admin/analytics" },
    ],
  },
  {
    title: "Engagement",
    icon: "◉",
    items: [{ label: "Engagement", href: "/engagement" }],
  },
  {
    title: "Affiliate",
    icon: "◎",
    items: [{ label: "Affiliate", href: "/affiliate" }],
  },
  {
    title: "Account",
    icon: "○",
    items: [{ label: "Account", href: "/account" }],
  },
];

function SidebarItem({ href, label }: NavItem) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={clsx(
        "block rounded-xl px-3 py-2 text-sm transition-colors",
        "border border-transparent",
        active
          ? "bg-[var(--panel-2)] border-[var(--border)] text-white"
          : "text-[var(--muted)] hover:text-white hover:bg-[var(--panel)]",
      )}
    >
      {label}
    </Link>
  );
}

export function Sidebar() {
  const { user, isLoggedIn, isAdmin, hydrate } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const visibleSections = useMemo(
    () => SECTIONS.filter((s) => !s.adminOnly || isAdmin),
    [isAdmin],
  );

  return (
    <div className="flex h-full min-h-screen flex-col gap-4 p-4 overflow-y-auto">
      {/* Brand */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] px-3 py-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold tracking-wide">UREMO</div>
            <div className="text-xs text-[var(--muted)]">AI Control Center</div>
          </div>
          {/* Mobile close button — visible only on small screens */}
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg border border-[var(--border)] bg-[var(--panel-2)] px-2 py-1 text-xs md:hidden"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-4 flex-1">
        {visibleSections.map((s) => (
          <section key={s.title} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
              <span>{s.icon}</span>
              <span>{s.title}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              {s.items.map((i) => (
                <SidebarItem key={i.href} {...i} />
              ))}
            </div>
          </section>
        ))}
      </nav>

      {/* Session */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3">
        <div className="text-xs text-[var(--muted)]">Session</div>
        <div className="mt-1 text-sm">
          {isLoggedIn ? (
            <div className="flex flex-col gap-1">
              <div className="truncate">
                {user?.name || user?.email || "Signed in"}
              </div>
              <div className="text-xs text-[var(--muted)]">
                Role:{" "}
                <span className="text-white">{isAdmin ? "admin" : "user"}</span>
              </div>
              <Link
                href="/logout"
                className="mt-2 inline-flex w-fit rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-xs font-semibold"
              >
                Sign out
              </Link>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <div className="text-[var(--muted)]">Signed out</div>
              <Link
                href="/login"
                className="inline-flex w-fit rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-3 py-2 text-xs font-semibold"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
