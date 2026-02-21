"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";

const NAV_LINKS = [
  { href: "/explore", label: "Explore" },
  { href: "/deals", label: "Deals" },
  { href: "/rentals", label: "Rentals" },
  { href: "/blogs", label: "Blogs" },
];

const USER_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/wallet", label: "Wallet" },
  { href: "/support", label: "Support" },
  { href: "/profile", label: "Profile" },
];

export function Navbar() {
  const { user, isLoggedIn, isAdmin, logout, hydrate } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    hydrate();
    setHydrated(true);
  }, [hydrate]);

  useEffect(() => {
    if (isLoggedIn) {
      apiRequest<{ count: number }>(EP.NOTIFICATIONS_UNREAD, "GET", undefined, true)
        .then((r) => setUnreadCount(r.count))
        .catch(() => {});
    }
  }, [isLoggedIn, pathname]);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + "/");

  return (
    <nav className="nav-root">
      <div className="nav-inner">
        <Link href="/explore" className="nav-logo">UREMO</Link>

        {/* Desktop Nav */}
        <div className="nav-links u-hide-mobile">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${isActive(link.href) ? "nav-link-active" : ""}`}
            >
              {link.label}
            </Link>
          ))}
          {hydrated && isLoggedIn && (
            <Link
              href="/workspace"
              className={`nav-link ${isActive("/workspace") ? "nav-link-active" : ""}`}
            >
              Workspace
            </Link>
          )}
        </div>

        {/* Right Side */}
        <div className="nav-right">
          {hydrated && isLoggedIn ? (
            <>
              <Link href="/notifications" className="nav-bell">
                🔔
                {unreadCount > 0 && (
                  <span className="nav-bell-badge">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>

              {isAdmin && (
                <Link href="/admin" className="nav-admin u-hide-mobile">
                  Admin
                </Link>
              )}

              <div ref={userMenuRef} style={{ position: "relative" }} className="u-hide-mobile">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="nav-user-btn"
                >
                  <span className="nav-avatar">
                    {user?.name?.[0]?.toUpperCase() || "U"}
                  </span>
                  <span className="nav-user-name">{user?.name || "User"}</span>
                  <span className="nav-chevron">▾</span>
                </button>

                {userMenuOpen && (
                  <div className="nav-dropdown">
                    {USER_LINKS.map((link) => (
                      <Link key={link.href} href={link.href} className="nav-dropdown-item">
                        {link.label}
                      </Link>
                    ))}
                    <div className="nav-dropdown-divider" />
                    <button
                      onClick={handleLogout}
                      className="nav-dropdown-item nav-dropdown-danger"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : hydrated ? (
            <div className="u-hide-mobile" style={{ display: "flex", gap: "var(--space-2)" }}>
              <Link href="/login" className="u-btn u-btn-ghost">Login</Link>
              <Link href="/signup" className="u-btn u-btn-primary">Sign Up</Link>
            </div>
          ) : null}

          <button
            className="nav-hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="nav-mobile-menu">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="nav-mobile-link">
              {link.label}
            </Link>
          ))}
          {hydrated && isLoggedIn ? (
            <>
              <Link href="/workspace" className="nav-mobile-link">Workspace</Link>
              {USER_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="nav-mobile-link">
                  {link.label}
                </Link>
              ))}
              {isAdmin && <Link href="/admin" className="nav-mobile-link">Admin</Link>}
              <button onClick={handleLogout} className="nav-mobile-link nav-dropdown-danger">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="nav-mobile-link">Login</Link>
              <Link href="/signup" className="nav-mobile-link">Sign Up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
