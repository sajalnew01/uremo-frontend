"use client";

// Backwards-compat re-export (older imports used SidebarContext).
export { SidebarProvider } from "@/components/sidebar/SidebarProvider";

import { useSidebarStore } from "@/components/sidebar/SidebarProvider";

export function useSidebar() {
  // Preserve the old API shape for existing callsites.
  const { isSidebarOpen, openSidebar, closeSidebar, toggleSidebar } =
    useSidebarStore();
  return {
    isOpen: isSidebarOpen,
    open: openSidebar,
    close: closeSidebar,
    toggle: toggleSidebar,
  };
}
