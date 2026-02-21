"use client";

import { useEffect } from "react";
import { useToastListener } from "@/hooks/useToast";
import type { ReactNode } from "react";

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, subscribe } = useToastListener();

  useEffect(() => {
    const unsub = subscribe();
    return () => { unsub(); };
  }, [subscribe]);

  const typeColors: Record<string, { bg: string; border: string }> = {
    success: { bg: "var(--color-success-bg)", border: "var(--color-success)" },
    error: { bg: "var(--color-error-bg)", border: "var(--color-error)" },
    warning: { bg: "var(--color-warning-bg)", border: "var(--color-warning)" },
    info: { bg: "var(--color-info-bg)", border: "var(--color-info)" },
  };

  return (
    <>
      {children}
      <div
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: "var(--z-toast)" as unknown as number,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          pointerEvents: "none",
          maxWidth: 380,
        }}
      >
        {toasts.map((t) => {
          const c = typeColors[t.type] ?? typeColors.info;
          return (
            <div
              key={t.id}
              style={{
                padding: "var(--space-3) var(--space-4)",
                background: c.bg,
                border: `1px solid ${c.border}`,
                borderRadius: "var(--radius-md)",
                color: "var(--color-text-primary)",
                fontSize: "var(--text-sm)",
                boxShadow: "var(--shadow-md)",
                pointerEvents: "auto",
                animation: "u-toast-in 0.2s ease",
              }}
            >
              {t.message}
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes u-toast-in {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
}
