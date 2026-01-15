"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
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

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

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
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setItems((prev) => [
        ...prev,
        { id, message: clampMessage(message), type },
      ]);

      window.setTimeout(() => {
        remove(id);
      }, 4500);
    },
    [remove, clampMessage]
  );

  const value = useMemo(
    () => ({ toast, remove, items }),
    [toast, remove, items]
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
