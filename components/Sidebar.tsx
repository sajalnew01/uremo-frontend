"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/hooks/useSidebar";

export default function Sidebar() {
  const { isAuthenticated, user } = useAuth();
  const { isSidebarOpen, closeSidebar } = useSidebar();
  const pathname = usePathname();

  if (!isAuthenticated) return null;

  const links = [
    { name: "Dashboard", href: "/dashboard" },
    { name: "Buy Service", href: "/buy-service" },
    { name: "My Orders", href: "/orders" },
    { name: "Apply to Work", href: "/apply-to-work" },
  ];

  const adminLinks = [
    { name: "Admin", href: "/admin" },
    { name: "Inbox", href: "/admin/messages" },
    { name: "Applications", href: "/admin/applications" },
    { name: "Services", href: "/admin/services" },
    { name: "Orders", href: "/admin/orders" },
    { name: "Rejected Orders", href: "/admin/rejected-orders" },
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
          className="fixed inset-0 bg-black/60 md:hidden z-40 pointer-events-auto"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        aria-hidden={!isSidebarOpen}
        className={`fixed top-0 left-0 h-full w-[80vw] max-w-[280px] bg-[#020617]/95 border-r border-white/10 p-5 md:hidden z-50 transform transition-transform duration-200 backdrop-blur ${
          isSidebarOpen
            ? "translate-x-0 pointer-events-auto"
            : "-translate-x-full pointer-events-none"
        }`}
      >
        <nav className="space-y-3" onClick={closeSidebar}>
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

      {/* Desktop sidebar */}
      <aside className="hidden md:block fixed left-0 top-14 w-[260px] h-[calc(100vh-56px)] border-r border-white/10 bg-black/10 backdrop-blur z-30">
        <nav className="space-y-3 p-5 overflow-y-auto h-full">
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
