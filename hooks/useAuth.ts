"use client";

import { useCallback, useEffect, useState } from "react";
import { clearAuthSession, notifyAuthChanged } from "@/lib/api";

type User = { email?: string; role?: string; name?: string } | null;

const AUTH_CHANGED_EVENT = "auth-changed";

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User>(null);
  const [ready, setReady] = useState(false);

  const syncFromStorage = useCallback(() => {
    try {
      const t = localStorage.getItem("token");
      const u = localStorage.getItem("user");
      setToken(t);
      if (!t) {
        // Prevent stale user objects from making UI think you're logged in.
        setUser(null);
        if (u) localStorage.removeItem("user");
        document.cookie = "role=; Path=/; Max-Age=0; SameSite=Lax";
        return;
      }

      const parsed = u ? JSON.parse(u) : null;
      setUser(parsed);

      // Keep middleware role cookie aligned for existing sessions.
      const role = parsed?.role || null;
      if (role) {
        document.cookie = `role=${encodeURIComponent(
          role
        )}; Path=/; Max-Age=${60 * 60 * 24 * 7}; SameSite=Lax`;
      }
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
    clearAuthSession();
    window.location.href = "/login";
  };

  return {
    ready,
    token,
    user,
    isAuthenticated: !!token,
    isLoggedIn: !!token,
    isAdmin: user?.role === "admin",
    logout,
  };
}
