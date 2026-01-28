"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Card from "@/components/Card";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/useToast";
import { setAdminSupportUnreadFromServer } from "@/lib/supportUnread";

type InboxItem = {
  orderId: string;
  lastMessage: string;
  lastAt: string;
  status: string;
  userEmail: string;
  serviceTitle: string;
  unreadCount?: number;
};

export default function AdminInboxPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/api/admin/messages", "GET", null, true);
      const list = Array.isArray(data) ? data : [];
      setItems(list);

      // Keep navbar badge aligned with what the admin sees in the inbox.
      const byOrder: Record<string, number> = {};
      for (const it of list) {
        const count = Number((it as any)?.unreadCount || 0);
        if (count > 0) byOrder[String((it as any)?.orderId || "")] = count;
      }
      setAdminSupportUnreadFromServer(byOrder);
    } catch (e: any) {
      toast(e?.message || "Failed to load inbox", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const badge = (status: string) => {
    const map: Record<string, string> = {
      pending: "bg-blue-600",
      waiting_user: "bg-yellow-600",
      in_progress: "bg-purple-600",
      completed: "bg-green-600",
      cancelled: "bg-red-600",
    };
    return map[status] || "bg-gray-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin — Inbox</h1>
        <button
          type="button"
          onClick={load}
          className="text-sm text-[#9CA3AF] hover:text-white transition"
        >
          Refresh
        </button>
      </div>

      <Card>
        {loading ? (
          <p className="text-sm text-[#9CA3AF]">Loading…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-[#9CA3AF]">No messages yet.</p>
        ) : (
          <div className="divide-y divide-white/10">
            {items.map((it) => (
              <div
                key={it.orderId}
                className="py-4 flex gap-4 items-start hover:bg-white/[0.03] -mx-6 px-6 transition"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-white">{it.userEmail}</p>
                    {Number(it.unreadCount || 0) > 0 && (
                      <span className="text-xs px-2 py-1 rounded bg-red-600 text-white">
                        {Number(it.unreadCount || 0) > 99
                          ? "99+"
                          : Number(it.unreadCount || 0)}
                      </span>
                    )}
                    <span
                      className={`text-xs px-2 py-1 rounded ${badge(
                        it.status,
                      )}`}
                    >
                      {it.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-sm text-[#9CA3AF] mt-1">
                    {it.serviceTitle}
                  </p>
                  <div className="mt-3 inline-flex max-w-[46rem] rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
                    <p className="text-sm text-slate-200 line-clamp-2">
                      {it.lastMessage}
                    </p>
                  </div>
                  <p className="text-xs text-[#9CA3AF] mt-2">
                    {new Date(it.lastAt).toLocaleString()}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => router.push(`/admin/orders/${it.orderId}`)}
                  className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 transition"
                >
                  Open
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
