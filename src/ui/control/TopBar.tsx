"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useAuthStore, useUIStore } from "@/store";
import {
  useUnreadCount,
  NotificationDrawer,
} from "@/ui/control/NotificationDrawer";
import { CommandPalette } from "@/ui/control/CommandPalette";

function titleFromPath(pathname: string): string {
  if (pathname === "/marketplace") return "Marketplace";
  if (pathname.startsWith("/marketplace/service")) return "Service";
  if (pathname.startsWith("/marketplace/orders")) return "Orders";
  if (pathname.startsWith("/marketplace/rentals")) return "Rentals";

  if (pathname === "/workforce") return "Workforce";
  if (pathname.startsWith("/workforce/screening")) return "Screening";
  if (pathname.startsWith("/workforce/project")) return "Project";
  if (pathname.startsWith("/workforce/earnings")) return "Earnings";

  if (pathname.startsWith("/finance/wallet")) return "Wallet";
  if (pathname.startsWith("/finance/transactions")) return "Transactions";
  if (pathname.startsWith("/finance/withdrawals")) return "Withdrawals";

  if (pathname.startsWith("/admin/services")) return "Admin · Services";
  if (pathname.startsWith("/admin/orders")) return "Admin · Orders";
  if (pathname.startsWith("/admin/rentals")) return "Admin · Rentals";
  if (pathname.startsWith("/admin/workforce")) return "Admin · Workforce";
  if (pathname.startsWith("/admin/screenings")) return "Admin · Screenings";
  if (pathname.startsWith("/admin/projects")) return "Admin · Projects";
  if (pathname.startsWith("/admin/wallet")) return "Admin · Wallet";
  if (pathname.startsWith("/admin/finance")) return "Admin · Finance";
  if (pathname.startsWith("/admin/users")) return "Admin · Users";
  if (pathname.startsWith("/admin/tickets")) return "Admin · Tickets";
  if (pathname.startsWith("/admin/blogs")) return "Admin · Blogs";
  if (pathname.startsWith("/admin/datasets")) return "Admin · Datasets";
  if (pathname.startsWith("/admin/analytics")) return "Admin · Analytics";
  if (pathname.startsWith("/admin")) return "Admin";

  if (pathname.startsWith("/engagement")) return "Engagement";
  if (pathname.startsWith("/affiliate")) return "Affiliate";
  if (pathname.startsWith("/account")) return "Account";

  return "Control Center";
}

export function TopBar() {
  const pathname = usePathname();
  const title = titleFromPath(pathname);
  const { user, isLoggedIn, isAdmin } = useAuthStore();
  const { setSidebarOpen } = useUIStore();

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const unreadQuery = useUnreadCount(isLoggedIn);
  const unreadCount = unreadQuery.data ?? 0;

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const closePalette = useCallback(() => setPaletteOpen(false), []);

  // Global Ctrl/Cmd+K shortcut
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <>
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6 md:py-4">
        {/* Left: hamburger (mobile) + title */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-2 py-1.5 text-sm md:hidden"
            aria-label="Open sidebar"
          >
            ☰
          </button>
          <div>
            <div className="text-base font-semibold tracking-tight md:text-lg">
              {title}
            </div>
            <div className="text-xs text-[var(--muted)] hidden sm:block">
              {pathname}
            </div>
          </div>
        </div>

        {/* Right: search, notifications, user */}
        <div className="flex items-center gap-2">
          {/* Command Palette trigger */}
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs text-[var(--muted)] hover:text-white"
          >
            <span>Search</span>
            <kbd className="rounded border border-[var(--border)] bg-[var(--panel-2)] px-1.5 py-0.5 text-[10px] font-mono">
              ⌘K
            </kbd>
          </button>

          {/* Notification bell */}
          {isLoggedIn && (
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="relative rounded-xl border border-[var(--border)] bg-[var(--panel)] px-2.5 py-1.5 text-sm hover:bg-[var(--panel-2)]"
              aria-label="Notifications"
            >
              ◈
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
          )}

          {/* User identity */}
          {isLoggedIn ? (
            <div className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] text-[10px] font-bold text-white">
                {(user?.name?.[0] || user?.email?.[0] || "U").toUpperCase()}
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-semibold truncate max-w-[120px]">
                  {user?.name || user?.email || "User"}
                </div>
                <div className="text-[10px] text-[var(--muted)]">
                  {isAdmin ? "Admin" : "User"}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-2 text-xs text-[var(--muted)]">
              Not signed in
            </div>
          )}
        </div>
      </div>

      {/* Notification Drawer */}
      <NotificationDrawer open={drawerOpen} onClose={closeDrawer} />

      {/* Command Palette */}
      <CommandPalette open={paletteOpen} onClose={closePalette} />
    </>
  );
}
