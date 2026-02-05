"use client";

/**
 * PATCH_63: MASTER ADMIN REBUILD
 *
 * Complete redesign of admin panel as an OPERATING SYSTEM.
 * - LEFT: Command Rail (operations-based, collapsible)
 * - TOP: Context Bar (current entity + available actions)
 * - CENTER: Master Workspace (dynamic canvas)
 * - RIGHT: Inspector Drawer (optional)
 */

import AdminLayoutV2 from "@/components/admin/v2/AdminLayoutV2";
import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminLayoutV2>{children}</AdminLayoutV2>;
}
