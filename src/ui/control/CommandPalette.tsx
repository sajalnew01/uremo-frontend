"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store";

interface PaletteItem {
  id: string;
  label: string;
  section: string;
  href: string;
  adminOnly?: boolean;
}

const PALETTE_ITEMS: PaletteItem[] = [
  // Marketplace
  {
    id: "mp-browse",
    label: "Browse Marketplace",
    section: "Marketplace",
    href: "/marketplace",
  },
  {
    id: "mp-orders",
    label: "My Orders",
    section: "Marketplace",
    href: "/marketplace/orders",
  },
  {
    id: "mp-rentals",
    label: "My Rentals",
    section: "Marketplace",
    href: "/marketplace/rentals",
  },

  // Workforce
  {
    id: "wf-dash",
    label: "Workforce Dashboard",
    section: "Workforce",
    href: "/workforce",
  },
  {
    id: "wf-earnings",
    label: "Earnings",
    section: "Workforce",
    href: "/workforce/earnings",
  },

  // Finance
  {
    id: "fi-wallet",
    label: "Wallet",
    section: "Finance",
    href: "/finance/wallet",
  },
  {
    id: "fi-txns",
    label: "Transactions",
    section: "Finance",
    href: "/finance/transactions",
  },
  {
    id: "fi-wd",
    label: "Withdrawals",
    section: "Finance",
    href: "/finance/withdrawals",
  },

  // Admin
  {
    id: "ad-services",
    label: "Admin Services",
    section: "Admin",
    href: "/admin/services",
    adminOnly: true,
  },
  {
    id: "ad-orders",
    label: "Admin Orders",
    section: "Admin",
    href: "/admin/orders",
    adminOnly: true,
  },
  {
    id: "ad-rentals",
    label: "Admin Rentals",
    section: "Admin",
    href: "/admin/rentals",
    adminOnly: true,
  },
  {
    id: "ad-workforce",
    label: "Admin Workforce",
    section: "Admin",
    href: "/admin/workforce",
    adminOnly: true,
  },
  {
    id: "ad-screenings",
    label: "Admin Screenings",
    section: "Admin",
    href: "/admin/screenings",
    adminOnly: true,
  },
  {
    id: "ad-projects",
    label: "Admin Projects",
    section: "Admin",
    href: "/admin/projects",
    adminOnly: true,
  },
  {
    id: "ad-wallet",
    label: "Admin Wallet",
    section: "Admin",
    href: "/admin/wallet",
    adminOnly: true,
  },
  {
    id: "ad-finance",
    label: "Admin Finance",
    section: "Admin",
    href: "/admin/finance",
    adminOnly: true,
  },
  {
    id: "ad-users",
    label: "Admin Users",
    section: "Admin",
    href: "/admin/users",
    adminOnly: true,
  },
  {
    id: "ad-tickets",
    label: "Admin Tickets",
    section: "Admin",
    href: "/admin/tickets",
    adminOnly: true,
  },
  {
    id: "ad-blogs",
    label: "Admin Blogs",
    section: "Admin",
    href: "/admin/blogs",
    adminOnly: true,
  },
  {
    id: "ad-datasets",
    label: "Admin Datasets",
    section: "Admin",
    href: "/admin/datasets",
    adminOnly: true,
  },
  {
    id: "ad-analytics",
    label: "Admin Analytics",
    section: "Admin",
    href: "/admin/analytics",
    adminOnly: true,
  },

  // Engagement
  {
    id: "eng-main",
    label: "Engagement",
    section: "Engagement",
    href: "/engagement",
  },

  // Affiliate
  {
    id: "aff-main",
    label: "Affiliate",
    section: "Affiliate",
    href: "/affiliate",
  },

  // Account
  { id: "acc-main", label: "Account", section: "Account", href: "/account" },
];

export function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { isAdmin } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);

  // Filter items
  const filtered = useMemo(() => {
    const items = PALETTE_ITEMS.filter((i) => !i.adminOnly || isAdmin);
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        i.section.toLowerCase().includes(q) ||
        i.href.toLowerCase().includes(q),
    );
  }, [search, isAdmin]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIdx(0);
  }, [search]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setSearch("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape, navigate on Enter, arrow keys
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1));
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(i - 1, 0));
      }
      if (e.key === "Enter" && filtered.length > 0) {
        e.preventDefault();
        const item = filtered[selectedIdx];
        if (item) {
          router.push(item.href);
          onClose();
        }
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose, filtered, selectedIdx, router]);

  if (!open) return null;

  // Group by section
  const grouped: Record<string, PaletteItem[]> = {};
  for (const item of filtered) {
    if (!grouped[item.section]) grouped[item.section] = [];
    grouped[item.section].push(item);
  }

  let globalIdx = 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--bg)] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="border-b border-[var(--border)] px-4 py-3">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search pages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
          />
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-sm text-[var(--muted)] text-center">
              No results for &ldquo;{search}&rdquo;
            </div>
          ) : (
            Object.entries(grouped).map(([section, items]) => (
              <div key={section}>
                <div className="px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                  {section}
                </div>
                {items.map((item) => {
                  const thisIdx = globalIdx++;
                  const isSelected = thisIdx === selectedIdx;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                        isSelected
                          ? "bg-[var(--panel-2)] text-white"
                          : "text-[var(--muted)] hover:bg-[var(--panel)] hover:text-white"
                      }`}
                      onMouseEnter={() => setSelectedIdx(thisIdx)}
                      onClick={() => {
                        router.push(item.href);
                        onClose();
                      }}
                    >
                      <span className="flex-1">{item.label}</span>
                      <span className="text-xs text-[var(--muted)]">
                        {item.href}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] px-4 py-2 flex items-center gap-3 text-xs text-[var(--muted)]">
          <span>↑↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </div>
    </div>
  );
}
