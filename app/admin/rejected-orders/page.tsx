"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * PATCH_37: Redirect from old /admin/rejected-orders to /admin/cancelled-orders
 * Status terminology normalized from "rejected" to "cancelled"
 */
export default function AdminRejectedOrdersRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/cancelled-orders");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <p className="text-sm text-[#9CA3AF]">Redirecting to Cancelled Orders…</p>
    </div>
  );
}
