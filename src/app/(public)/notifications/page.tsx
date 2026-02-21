"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api/client";
import { EP } from "@/lib/api/endpoints";
import { useRequireAuth } from "@/hooks/useAuth";
import { emitToast } from "@/hooks/useToast";
import type { Notification } from "@/types";

export default function NotificationsPage() {
  const ready = useRequireAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{ notifications: Notification[] }>({
    queryKey: ["notifications"],
    queryFn: () => apiRequest(EP.NOTIFICATIONS, "GET", undefined, true),
    enabled: ready,
  });

  const markAllMutation = useMutation({
    mutationFn: () => apiRequest(EP.NOTIFICATIONS_READ_ALL, "PUT", undefined, true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      emitToast("All notifications marked as read", "success");
    },
  });

  const markOneMutation = useMutation({
    mutationFn: (id: string) => apiRequest(EP.NOTIFICATION_READ(id), "PUT", undefined, true),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  if (!ready) return null;

  const notifications = data?.notifications || [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="page-content">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)" }}>
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <button
            className="u-btn u-btn-secondary u-btn-sm"
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
          >
            Mark All Read
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="page-loading"><div className="u-spinner" /> Loading...</div>
      ) : notifications.length === 0 ? (
        <div className="page-empty">No notifications yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
          {notifications.map((n) => (
            <div
              key={n._id}
              className="u-card"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                cursor: n.read ? "default" : "pointer",
                borderLeftWidth: 3,
                borderLeftStyle: "solid",
                borderLeftColor: n.read ? "transparent" : "var(--color-brand)",
                opacity: n.read ? 0.7 : 1,
              }}
              onClick={() => !n.read && markOneMutation.mutate(n._id)}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "var(--weight-semibold)", fontSize: "var(--text-sm)" }}>
                  {n.title}
                </div>
                <div style={{ fontSize: "var(--text-sm)", color: "var(--color-text-secondary)", marginTop: "var(--space-1)" }}>
                  {n.message}
                </div>
              </div>
              <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)", whiteSpace: "nowrap", marginLeft: "var(--space-4)" }}>
                {new Date(n.createdAt).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
