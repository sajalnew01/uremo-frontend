"use client";

import { useSidebarStore } from "@/components/sidebar/SidebarProvider";

export function useSidebar() {
  return useSidebarStore();
}
