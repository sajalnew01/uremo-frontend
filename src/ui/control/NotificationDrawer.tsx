"use client";

import { useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { EP } from "@/lib/api/endpoints";
import type { Notification } from "@/types";

type NotificationsResponse = {
  ok?: boolean;
  success?: boolean;
  notifications?: Notification[];
  data?: Notification[];
};

type UnreadCountResponse = {
  ok?: boolean;
  success?: boolean;
  count?: number;
  unreadCount?: number;
};

/* ─── HOOK: useUnreadCount ─── */
export function useUnreadCount(enabled: boolean) {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: async () => {
      const res = await apiRequest<UnreadCountResponse>(
        EP.NOTIFICATIONS_UNREAD,
        "GET",
        undefined,
        true,
      );
      return res.count ?? res.unreadCount ?? 0;
    },
    enabled,
    refetchInterval: 60_000, // poll every 60s
    staleTime: 15_000,
  });
}

/* ─── DRAWER COMPONENT ─── */
export function NotificationDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await apiRequest<NotificationsResponse>(
        EP.NOTIFICATIONS,
        "GET",
        undefined,
        true,
      );
      return res.notifications ?? res.data ?? [];
    },
    enabled: open,
    staleTime: 10_000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) =>
      apiRequest(EP.NOTIFICATION_READ(id), "PUT", undefined, true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () =>
      apiRequest(EP.NOTIFICATIONS_READ_ALL, "PUT", undefined, true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    },
  });

  const notifications = query.data ?? [];
  const unread = notifications.filter((n) => !n.read);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-sm">
      <div
        ref={panelRef}
        className="h-full w-full max-w-md border-l border-[var(--border)] bg-[var(--bg)] shadow-2xl animate-in slide-in-from-right overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--border)] bg-[var(--bg)] px-5 py-4">
          <div>
            <div className="text-sm font-semibold">Notifications</div>
            <div className="text-xs text-[var(--muted)]">
              {unread.length} unread
            </div>
          </div>
          <div className="flex items-center gap-2">
            {unread.length > 0 && (
              <button
                type="button"
                disabled={markAllReadMutation.isPending}
                onClick={() => markAllReadMutation.mutate()}
                className="rounded-xl border border-[var(--border)] bg-[var(--panel)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)] hover:text-white"
              >
                Mark all read
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--border)] bg-[var(--panel)] px-2 py-1 text-xs"
              aria-label="Close notifications"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        {query.isLoading ? (
          <div className="px-5 py-8 text-sm text-[var(--muted)]">
            Loading notifications...
          </div>
        ) : query.isError ? (
          <div className="px-5 py-8 text-sm text-[var(--muted)]">
            Failed to load notifications.
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-5 py-8 text-sm text-[var(--muted)]">
            No notifications yet.
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {notifications.map((n) => (
              <div
                key={n._id}
                className={`px-5 py-4 ${!n.read ? "bg-[var(--panel)]" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {!n.read && (
                        <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent)]" />
                      )}
                      <div className="truncate text-sm font-semibold">
                        {n.title}
                      </div>
                    </div>
                    <div className="mt-1 text-sm text-[var(--muted)] line-clamp-2">
                      {n.message}
                    </div>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-[var(--muted)]">
                      <span className="rounded-lg border border-[var(--border)] px-1.5 py-0.5">
                        {n.type}
                      </span>
                      <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  {!n.read && (
                    <button
                      type="button"
                      disabled={markReadMutation.isPending}
                      onClick={() => markReadMutation.mutate(n._id)}
                      className="shrink-0 rounded-xl border border-[var(--border)] bg-[var(--panel-2)] px-2.5 py-1 text-xs text-[var(--muted)] hover:text-white"
                    >
                      Read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
