"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function ProfileMenu() {
  const { user, logout, isAdmin } = useAuth();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const email = String(user?.email || "").trim();
  const avatarLetter = useMemo(() => {
    const v = email || user?.name || "U";
    return String(v).trim().charAt(0).toUpperCase() || "U";
  }, [email, user?.name]);

  // Close on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on outside click
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

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account"
      >
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-white/10 border border-white/10 text-white font-semibold">
          {avatarLetter}
        </span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Profile menu"
          className="absolute right-0 mt-2 w-[280px] rounded-2xl border border-white/10 bg-[#020617]/95 backdrop-blur shadow-[0_18px_60px_rgba(0,0,0,0.45)] overflow-hidden z-[9999]"
        >
          <div className="p-4 border-b border-white/10">
            <p className="text-[11px] tracking-widest text-slate-400">
              SIGNED IN AS
            </p>
            <p className="text-sm text-white mt-1 truncate">{email || "—"}</p>
          </div>

          <div className="p-2">
            <Link
              role="menuitem"
              href="/profile"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
            >
              Profile
            </Link>

            <Link
              role="menuitem"
              href="/orders"
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
            >
              My Orders
            </Link>

            {isAdmin && (
              <Link
                role="menuitem"
                href="/admin"
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-2 text-sm text-slate-200 hover:bg-white/5"
              >
                Admin Panel
              </Link>
            )}

            <div className="my-2 h-px bg-white/10" />

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
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
