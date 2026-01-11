"use client";

import { useToast } from "@/hooks/useToast";

function typeStyles(type: "info" | "success" | "error") {
  if (type === "success")
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  if (type === "error") return "border-red-500/30 bg-red-500/10 text-red-200";
  return "border-white/15 bg-white/5 text-slate-200";
}

export default function ToastViewport() {
  const { items, remove } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3">
      {items.map((t) => (
        <div
          key={t.id}
          className={`min-w-[260px] max-w-[360px] rounded-xl border px-4 py-3 shadow-lg backdrop-blur ${typeStyles(
            t.type
          )}`}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm leading-5">{t.message}</p>
            <button
              className="text-slate-400 hover:text-slate-200 transition"
              onClick={() => remove(t.id)}
              aria-label="Dismiss"
              type="button"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
