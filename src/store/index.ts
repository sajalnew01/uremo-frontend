import { create } from "zustand";
import type { User, Intent } from "@/types";
import { getStoredUser, clearAuthSession, setAuthSession } from "@/lib/api";

interface AuthState {
  user: (User & { token?: string }) | null;
  isAdmin: boolean;
  isLoggedIn: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  setUser: (user: User) => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  isLoggedIn: false,

  login: (token, user) => {
    setAuthSession(token, user as unknown as Record<string, unknown>);
    set({ user, isAdmin: user.role === "admin", isLoggedIn: true });
  },

  logout: () => {
    clearAuthSession();
    set({ user: null, isAdmin: false, isLoggedIn: false });
  },

  setUser: (user) => {
    set({ user, isAdmin: user.role === "admin", isLoggedIn: true });
  },

  hydrate: () => {
    const stored = getStoredUser();
    if (stored) {
      set({
        user: stored as unknown as User,
        isAdmin: stored.role === "admin",
        isLoggedIn: true,
      });
    }
  },
}));

/* ─── UI STATE ─── */
interface UIState {
  sidebarOpen: boolean;
  intent: Intent;
  toggleSidebar: () => void;
  setSidebarOpen: (v: boolean) => void;
  setIntent: (i: Intent) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: false,
  intent: "all",
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  setIntent: (i) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("uremo_explore_intent", i);
    }
    set({ intent: i });
  },
}));

/* ─── ADMIN ENGINE NAV ─── */
export type AdminEngine =
  | "commerce" | "finance" | "workforce" | "rlhf"
  | "affiliate" | "tickets" | "engagement" | "system";

interface AdminState {
  activeEngine: AdminEngine;
  inspectorId: string | null;
  inspectorType: string | null;
  setEngine: (e: AdminEngine) => void;
  openInspector: (type: string, id: string) => void;
  closeInspector: () => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  activeEngine: "commerce",
  inspectorId: null,
  inspectorType: null,
  setEngine: (e) => set({ activeEngine: e, inspectorId: null, inspectorType: null }),
  openInspector: (type, id) => set({ inspectorType: type, inspectorId: id }),
  closeInspector: () => set({ inspectorId: null, inspectorType: null }),
}));
