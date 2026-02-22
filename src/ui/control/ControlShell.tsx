"use client";

import { Children, type ReactNode } from "react";
import { useUIStore } from "@/store";

export function ControlShell({ children }: { children: ReactNode }) {
  const parts = Children.toArray(children);
  const sidebar = parts[0] ?? null;
  const topBar = parts[1] ?? null;
  const mainViewport = parts[2] ?? null;
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      {/* Desktop: grid layout with fixed sidebar */}
      <div className="mx-auto grid min-h-screen grid-cols-1 md:grid-cols-[260px_1fr]">
        {/* Desktop sidebar */}
        <aside className="hidden md:block border-r border-[var(--border)]">
          {sidebar}
        </aside>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="relative z-50 h-full w-[280px] max-w-[80vw] border-r border-[var(--border)] bg-[var(--bg)] overflow-y-auto">
              {sidebar}
            </aside>
          </div>
        )}

        <div className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[color:var(--bg)]/80 backdrop-blur">
            {topBar}
          </header>

          {mainViewport}
        </div>
      </div>
    </div>
  );
}
