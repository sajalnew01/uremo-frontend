"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useRef,
} from "react";

type ToastType = "info" | "success" | "error";

export type ToastItem = {
  id: string;
  message: string;
  type: ToastType;
};

type ToastContextValue = {
  toast: (message: string, type?: ToastType) => void;
  remove: (id: string) => void;
  items: ToastItem[];
};

const ToastContext = createContext<ToastContextValue | null>(null);

// PATCH_54: Max toasts to prevent infinite stacking
const MAX_TOASTS = 5;
const TOAST_DURATION = 4500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  // PATCH_54: Track recent messages to prevent duplicates
  const recentMessages = useRef<Map<string, number>>(new Map());

  const clampMessage = useCallback((value: unknown) => {
    const maxLen = 240;
    let msg = "";
    if (typeof value === "string") msg = value;
    else if (value instanceof Error) msg = value.message;
    else if (value == null) msg = "";
    else {
      try {
        msg = JSON.stringify(value);
      } catch {
        msg = String(value);
      }
    }

    msg = msg.trim();
    if (!msg) return "Something went wrong";
    return msg.length <= maxLen ? msg : `${msg.slice(0, maxLen)}…`;
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = "info") => {
      const clampedMsg = clampMessage(message);
      const msgKey = `${type}:${clampedMsg}`;

      // PATCH_54: Prevent duplicate messages within 2 seconds
      const now = Date.now();
      const lastShown = recentMessages.current.get(msgKey);
      if (lastShown && now - lastShown < 2000) {
        return; // Skip duplicate
      }
      recentMessages.current.set(msgKey, now);

      // Clean up old entries
      if (recentMessages.current.size > 50) {
        const cutoff = now - 10000;
        recentMessages.current.forEach((time, key) => {
          if (time < cutoff) recentMessages.current.delete(key);
        });
      }

      const id = `${now}-${Math.random().toString(16).slice(2)}`;

      setItems((prev) => {
        // PATCH_54: Limit max toasts to prevent infinite stacking
        const newItems = [...prev, { id, message: clampedMsg, type }];
        if (newItems.length > MAX_TOASTS) {
          return newItems.slice(-MAX_TOASTS);
        }
        return newItems;
      });

      // PATCH_54: Auto-dismiss with cleanup
      window.setTimeout(() => {
        remove(id);
      }, TOAST_DURATION);
    },
    [remove, clampMessage],
  );

  const value = useMemo(
    () => ({ toast, remove, items }),
    [toast, remove, items],
  );

  return (
    <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
