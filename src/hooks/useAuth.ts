"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store";

/** Redirect to login if not authenticated */
export function useRequireAuth(redirectTo = "/login") {
  const { isLoggedIn, hydrate } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isLoggedIn) {
      const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
      router.replace(`${redirectTo}?next=${encodeURIComponent(currentPath)}`);
    }
  }, [isLoggedIn, router, redirectTo]);

  return isLoggedIn;
}

/** Redirect to login if not admin */
export function useRequireAdmin() {
  const { isAdmin, isLoggedIn, hydrate } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace("/login?next=/admin");
    } else if (!isAdmin) {
      router.replace("/");
    }
  }, [isLoggedIn, isAdmin, router]);

  return isAdmin && isLoggedIn;
}
