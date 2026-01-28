"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/hooks/useSidebar";
import { maskEmail } from "@/lib/maskEmail";

function SidebarUserMenu(props: { onNavigate?: () => void }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const email = String(user?.email || "").trim();
  const avatarLetter = useMemo(() => {
    const v = email || user?.name || "U";
    return String(v).trim().charAt(0).toUpperCase() || "U";
  }, [email, user?.name]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (!open) return;
      const el = wrapperRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  const onNavigate = () => {
    setOpen(false);
    props.onNavigate?.();
  };

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition px-3 py-3"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/10 border border-white/10 text-white font-semibold shrink-0">
            {avatarLetter}
          </span>
          <div className="min-w-0">
            <p className="text-sm text-white font-medium leading-tight">
              Account
            </p>
            <p className="text-xs text-slate-400 truncate leading-tight">
              {maskEmail(email) || "—"}
            </p>
          </div>
        </div>
        <span className="text-slate-400">▾</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Sidebar account menu"
          className="absolute left-0 right-0 mt-2 rounded-2xl border border-white/10 bg-[#020617]/95 backdrop-blur shadow-[0_18px_60px_rgba(0,0,0,0.45)] overflow-hidden z-[9999]"
        >
          <div className="p-2">
            <Link
              role="menuitem"
              href="/profile"
              onClick={onNavigate}
              className="block rounded-xl px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
            >
              My Profile
            </Link>

            <Link
              role="menuitem"
              href="/orders"
              onClick={onNavigate}
              className="block rounded-xl px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
            >
              My Orders
            </Link>

            <div className="my-2 h-px bg-white/10" />

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onNavigate();
                logout();
              }}
              className="w-full text-left rounded-xl px-3 py-2 text-sm text-red-200 hover:bg-red-500/10"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const { isAuthenticated, user } = useAuth();
  const { isSidebarOpen, closeSidebar } = useSidebar();
  const pathname = usePathname();

  if (!isAuthenticated) return null;

  const links = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Avail Service", href: "/avail-service" },
    { name: "My Orders", href: "/orders" },
    { name: "Apply to Work", href: "/apply-to-work" },
  ];

  const adminLinks = [
    { name: "Admin", href: "/admin" },
    { name: "CMS Settings", href: "/admin/settings" },
    { name: "JarvisX", href: "/admin/jarvisx" },
    { name: "Work Positions", href: "/admin/work-positions" },
    { name: "Inbox", href: "/admin/messages" },
    { name: "Applications", href: "/admin/applications" },
    { name: "Email Campaigns", href: "/admin/email" },
    { name: "Services", href: "/admin/services" },
    { name: "Orders", href: "/admin/orders" },
    { name: "Cancelled Orders", href: "/admin/cancelled-orders" },
    { name: "Payments", href: "/admin/payments" },
  ];

  const linkClass = (href: string) => {
    const active = pathname === href || pathname?.startsWith(`${href}/`);
    return `group flex items-center justify-between rounded-xl px-3 py-2 text-sm transition border ${
      active
        ? "bg-white/5 border-white/15 text-white"
        : "border-transparent text-zinc-300 hover:text-white hover:bg-white/5"
    }`;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 lg:hidden z-40 pointer-events-auto"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        aria-hidden={!isSidebarOpen}
        className={`fixed top-0 left-0 h-full w-[80vw] max-w-[280px] bg-[#020617]/95 border-r border-white/10 p-5 lg:hidden z-50 transform transition-transform duration-200 backdrop-blur ${
          isSidebarOpen
            ? "translate-x-0 pointer-events-auto"
            : "-translate-x-full pointer-events-none"
        }`}
      >
        <nav className="space-y-3">
          <SidebarUserMenu onNavigate={closeSidebar} />

          <p className="text-[11px] tracking-widest text-[#9CA3AF]">USER</p>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={linkClass(link.href)}
              onClick={closeSidebar}
            >
              <span>{link.name}</span>
              <span className="opacity-0 group-hover:opacity-100 transition text-[#9CA3AF]">
                →
              </span>
            </Link>
          ))}

          {user?.role === "admin" && (
            <div className="pt-4 mt-4 border-t border-white/10 space-y-3">
              <p className="text-[11px] tracking-widest text-[#9CA3AF]">
                ADMIN
              </p>
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={linkClass(link.href)}
                  onClick={closeSidebar}
                >
                  <span>{link.name}</span>
                  <span className="opacity-0 group-hover:opacity-100 transition text-[#9CA3AF]">
                    →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </nav>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed left-0 top-14 w-[260px] h-[calc(100vh-56px)] border-r border-white/10 bg-black/10 backdrop-blur z-30">
        <nav className="space-y-3 p-5 overflow-y-auto h-full">
          <div className="sticky top-0 z-10 -mx-5 px-5 pb-3 pt-2 bg-[#020617]/70 backdrop-blur border-b border-white/10">
            <SidebarUserMenu />
          </div>

          <p className="text-[11px] tracking-widest text-[#9CA3AF]">USER</p>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={linkClass(link.href)}
            >
              <span>{link.name}</span>
              <span className="opacity-0 group-hover:opacity-100 transition text-[#9CA3AF]">
                →
              </span>
            </Link>
          ))}

          {user?.role === "admin" && (
            <div className="pt-4 mt-4 border-t border-white/10 space-y-3">
              <p className="text-[11px] tracking-widest text-[#9CA3AF]">
                ADMIN
              </p>
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={linkClass(link.href)}
                >
                  <span>{link.name}</span>
                  <span className="opacity-0 group-hover:opacity-100 transition text-[#9CA3AF]">
                    →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}
