"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { useSidebar } from "@/components/SidebarContext";

export default function Sidebar() {
  const { isAuthenticated, user } = useAuth();
  const { isOpen, close } = useSidebar();

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
    { name: "Payments", href: "/admin/payments" },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 md:hidden z-40 pointer-events-auto"
          onClick={close}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-[#020617] border-r border-zinc-800 p-6 md:hidden z-50 transform transition-transform duration-200 pointer-events-auto ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <nav className="space-y-4" onClick={close}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-sm text-zinc-300 hover:text-white"
            >
              {link.name}
            </Link>
          ))}

          {user?.role === "admin" && (
            <div className="pt-4 mt-4 border-t border-white/10 space-y-3">
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-blue-300 hover:text-blue-200"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          )}
        </nav>
      </aside>

      {/* Desktop sidebar */}
      <aside className="w-64 border-r border-zinc-800 p-6 hidden md:block sticky top-0 h-screen z-30 relative">
        <nav className="space-y-4">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-sm text-zinc-300 hover:text-white"
            >
              {link.name}
            </Link>
          ))}

          {user?.role === "admin" && (
            <div className="pt-4 mt-4 border-t border-white/10 space-y-3">
              {adminLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-sm text-blue-300 hover:text-blue-200"
                >
                  {link.name}
                </Link>
              ))}
            </div>
          )}
        </nav>
      </aside>
    </>
  );
}
