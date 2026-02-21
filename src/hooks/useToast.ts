"use client";

import { useCallback, useState } from "react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

let toastIdCounter = 0;
const listeners: Set<(t: Toast) => void> = new Set();

export function emitToast(message: string, type: Toast["type"] = "info") {
  const toast: Toast = { id: String(++toastIdCounter), message, type };
  listeners.forEach((fn) => fn(toast));
}

export function useToast() {
  return useCallback((message: string, type: Toast["type"] = "info") => {
    emitToast(message, type);
  }, []);
}

export function useToastListener() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((t: Toast) => {
    setToasts((prev) => [...prev, t]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== t.id));
    }, 4000);
  }, []);

  const subscribe = useCallback(() => {
    listeners.add(addToast);
    return () => listeners.delete(addToast);
  }, [addToast]);

  return { toasts, subscribe };
}
