"use client";

import { useCallback, useEffect, useState } from "react";

type User = { email?: string; role?: string; name?: string } | null;

const AUTH_CHANGED_EVENT = "auth-changed";

export function notifyAuthChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User>(null);
  const [ready, setReady] = useState(false);

  const syncFromStorage = useCallback(() => {
    try {
      const t = localStorage.getItem("token");
      const u = localStorage.getItem("user");
      setToken(t);
      setUser(u ? JSON.parse(u) : null);
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    syncFromStorage();

    const handleAuthChanged = () => syncFromStorage();
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "token" || e.key === "user") syncFromStorage();
    };

    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
      window.removeEventListener("storage", handleStorage);
    };
  }, [syncFromStorage]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    document.cookie = "role=; Path=/; Max-Age=0; SameSite=Lax";
    notifyAuthChanged();
    window.location.href = "/login";
  };

  return {
    ready,
    token,
    user,
    isLoggedIn: !!token,
    isAdmin: user?.role === "admin",
    logout,
  };
}
