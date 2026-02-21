"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store";

const ENGINES = [
  { key: "commerce", label: "Commerce", icon: "🛒", href: "/admin/commerce" },
  { key: "finance", label: "Finance", icon: "💰", href: "/admin/finance" },
  { key: "workforce", label: "Workforce", icon: "👷", href: "/admin/workforce" },
  { key: "rlhf", label: "RLHF", icon: "🧠", href: "/admin/rlhf" },
  { key: "affiliate", label: "Affiliate", icon: "🤝", href: "/admin/affiliate" },
  { key: "tickets", label: "Tickets", icon: "🎫", href: "/admin/tickets" },
  { key: "engagement", label: "Engagement", icon: "📣", href: "/admin/engagement" },
  { key: "system", label: "System", icon: "⚙️", href: "/admin/system" },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, isAdmin, hydrate } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrate();
    setReady(true);
  }, [hydrate]);

  useEffect(() => {
    if (ready && (!isLoggedIn || !isAdmin)) {
      router.replace("/login?next=/admin");
    }
  }, [ready, isLoggedIn, isAdmin, router]);

  if (!ready || !isLoggedIn || !isAdmin) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--color-bg-primary)" }}>
        <div className="u-spinner" />
      </div>
    );
  }

  const activeKey = ENGINES.find((e) => pathname?.startsWith(e.href))?.key || "commerce";

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--color-bg-primary)" }}>
      {/* Sidebar */}
      <aside style={sidebarStyle}>
        <Link href="/admin" style={logoStyle}>
          <span style={{ fontSize: "var(--text-lg)", fontWeight: "var(--weight-bold)" }}>UREMO</span>
          <span style={{ fontSize: "var(--text-xs)", color: "var(--color-brand)", letterSpacing: "0.1em" }}>ADMIN</span>
        </Link>

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--space-1)", padding: "var(--space-2)" }}>
          {ENGINES.map((eng) => (
            <Link
              key={eng.key}
              href={eng.href}
              style={{
                ...navLinkStyle,
                ...(activeKey === eng.key ? navLinkActiveStyle : {}),
              }}
            >
              <span style={{ fontSize: "var(--text-base)" }}>{eng.icon}</span>
              <span>{eng.label}</span>
            </Link>
          ))}
        </nav>

        <div style={{ padding: "var(--space-3)", borderTop: "1px solid var(--color-border)" }}>
          <Link href="/explore" style={{ ...navLinkStyle, fontSize: "var(--text-xs)" }}>
            ← Back to App
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

const sidebarStyle: React.CSSProperties = {
  width: 220,
  flexShrink: 0,
  display: "flex",
  flexDirection: "column",
  borderRight: "1px solid var(--color-border)",
  background: "var(--color-bg-secondary)",
};

const logoStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 2,
  padding: "var(--space-4)",
  borderBottom: "1px solid var(--color-border)",
  textDecoration: "none",
  color: "var(--color-text-primary)",
};

const navLinkStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--space-3)",
  padding: "var(--space-2) var(--space-3)",
  borderRadius: "var(--radius-md)",
  color: "var(--color-text-secondary)",
  textDecoration: "none",
  fontSize: "var(--text-sm)",
  transition: "all var(--transition-fast)",
};

const navLinkActiveStyle: React.CSSProperties = {
  background: "var(--color-brand-muted)",
  color: "var(--color-brand)",
  fontWeight: "var(--weight-medium)" as unknown as number,
};
