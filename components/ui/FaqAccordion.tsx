"use client";

import { useState } from "react";
import type { FaqItem } from "@/hooks/useSiteSettings";

export default function FaqAccordion(props: {
  title?: string;
  items: FaqItem[];
  defaultOpenIndex?: number | null;
}) {
  const [open, setOpen] = useState<number | null>(props.defaultOpenIndex ?? 0);
  const items = Array.isArray(props.items) ? props.items : [];

  if (!items.length) return null;

  return (
    <div className="card">
      {props.title ? <h3 className="font-semibold">{props.title}</h3> : null}
      <div className={props.title ? "mt-3 space-y-2" : "space-y-2"}>
        {items.map((item, idx) => {
          const isOpen = open === idx;
          return (
            <div
              key={`${idx}-${item.q}`}
              className="rounded-xl border border-white/10 bg-white/5 overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpen((cur) => (cur === idx ? null : idx))}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-white/5 transition"
                aria-expanded={isOpen}
              >
                <span className="text-sm font-medium text-white">{item.q}</span>
                <span className="text-[#9CA3AF]">{isOpen ? "–" : "+"}</span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 text-sm text-slate-300">{item.a}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
