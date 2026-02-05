"use client";

/**
 * PATCH_63: MASTER ADMIN REBUILD
 *
 * Admin Landing Page = Action Queue
 * This is the DEFAULT admin landing view.
 *
 * Shows ALL pending actions sorted by:
 * 1. Revenue impact
 * 2. Time blocked
 * 3. Risk level
 */

import ActionQueuePage from "@/components/admin/v2/ActionQueuePage";

export default function AdminDashboard() {
  return <ActionQueuePage />;
}
