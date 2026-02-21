"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { useRequireAuth } from "@/hooks/useAuth";
import { Navbar } from "@/components/Navbar";
import { Badge } from "@/design-system";
import type { ApplyWork } from "@/types";

const WS_LINKS = [
  { href: "/workspace", label: "Overview", icon: "📋" },
  { href: "/workspace/screenings", label: "Screenings", icon: "📝" },
  { href: "/workspace/projects", label: "Projects", icon: "🗂️" },
  { href: "/workspace/proofs", label: "Proofs", icon: "✅" },
  { href: "/workspace/earnings", label: "Earnings", icon: "💰" },
];

export default function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const ready = useRequireAuth();
  const pathname = usePathname();

  const { data: appData } = useQuery<{ applications: ApplyWork[] }>({
    queryKey: ["my-applications"],
    queryFn: () => apiRequest(EP.APPLY_WORK_ME, "GET", undefined, true),
    enabled: ready,
  });

  const currentApp = appData?.applications?.[0];
  const workerStatus = currentApp?.workerStatus || "fresh";

  if (!ready) return null;

  return (
    <>
      <Navbar />
      <div className="page-shell">
        {/* Worker Status Ribbon */}
        <div className="ws-ribbon">
          <span style={{ fontSize: "var(--text-sm)", fontWeight: "var(--weight-semibold)", color: "var(--color-text-primary)" }}>
            Worker Status:
          </span>
          <Badge status={workerStatus} />
          {currentApp?.tier && (
            <>
              <span style={{ fontSize: "var(--text-sm)", color: "var(--color-text-tertiary)" }}>Tier:</span>
              <Badge status={currentApp.tier} size="sm" />
            </>
          )}
          {currentApp?.screeningsCompleted && currentApp.screeningsCompleted.length > 0 && (
            <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)", marginLeft: "auto" }}>
              {currentApp.screeningsCompleted.filter((s) => s.passed).length} screening(s) passed
            </span>
          )}
        </div>

        <div style={{ display: "flex", minHeight: "calc(100vh - 56px - 50px)" }}>
          {/* Sidebar */}
          <nav className="ws-sidebar">
            {WS_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`ws-sidebar-link ${pathname === link.href ? "ws-sidebar-link-active" : ""}`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>

          {/* Content */}
          <div style={{ flex: 1, padding: "var(--space-6)" }}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
