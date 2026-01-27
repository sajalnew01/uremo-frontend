"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: "order" | "ticket" | "wallet" | "affiliate" | "rental" | "system";
  resourceType?: "order" | "ticket" | "rental" | "withdrawal" | null;
  resourceId?: string;
  isRead: boolean;
  createdAt: string;
}

const typeIcons: Record<string, string> = {
  order: "📦",
  ticket: "🎫",
  wallet: "💰",
  affiliate: "🤝",
  rental: "🔑",
  system: "🔔",
};

const typeColors: Record<string, string> = {
  order: "bg-blue-500/20 text-blue-400",
  ticket: "bg-purple-500/20 text-purple-400",
  wallet: "bg-green-500/20 text-green-400",
  affiliate: "bg-orange-500/20 text-orange-400",
  rental: "bg-cyan-500/20 text-cyan-400",
  system: "bg-gray-500/20 text-gray-400",
};

export default function NotificationBell() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load notifications
  const loadNotifications = async () => {
    if (!isAuthenticated) return;

    try {
      const res = await apiRequest<any>(
        "/api/notifications?limit=20",
        "GET",
        null,
        true,
      );
      if (res.notifications) {
        setNotifications(res.notifications);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to load notifications:", err);
    }
  };

  // Fetch unread count only (lightweight)
  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;

    try {
      const res = await apiRequest<any>(
        "/api/notifications/unread-count",
        "GET",
        null,
        true,
      );
      if (typeof res.unreadCount === "number") {
        setUnreadCount(res.unreadCount);
      }
    } catch (err) {
      // Silently fail
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      await apiRequest<any>(
        `/api/notifications/${notificationId}/read`,
        "PUT",
        {},
        true,
      );
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notificationId ? { ...n, isRead: true } : n,
        ),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await apiRequest<any>("/api/notifications/read-all", "PUT", {}, true);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.isRead) {
      await markAsRead(notification._id);
    }

    // Navigate based on resource type
    if (notification.resourceType && notification.resourceId) {
      const routes: Record<string, string> = {
        order: `/orders/${notification.resourceId}`,
        ticket: `/support/tickets/${notification.resourceId}`,
        rental: `/rentals`,
        withdrawal: `/affiliate/withdrawals`,
      };
      const route = routes[notification.resourceType];
      if (route) {
        router.push(route);
        setIsOpen(false);
      }
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Initial load and polling
  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
      // Poll every 30 seconds for new notifications
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  // Load full list when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      loadNotifications().finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isAuthenticated) return null;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all"
        aria-label="Notifications"
        title="Notifications"
      >
        <svg
          className="w-5 h-5 text-slate-200"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[11px] leading-5 text-center border border-slate-900">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-hidden rounded-xl bg-[#1F2937] border border-white/10 shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-emerald-400 hover:text-emerald-300 transition"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto max-h-72">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-400">
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-400">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition ${
                    !n.isRead ? "bg-white/5" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <span
                      className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm ${typeColors[n.type] || typeColors.system}`}
                    >
                      {typeIcons[n.type] || "🔔"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm truncate ${!n.isRead ? "font-semibold" : ""}`}
                        >
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate mt-0.5">
                        {n.message}
                      </p>
                      <p className="text-[10px] text-gray-500 mt-1">
                        {formatTime(n.createdAt)}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 border-t border-white/10">
              <button
                onClick={() => {
                  router.push("/notifications");
                  setIsOpen(false);
                }}
                className="w-full text-center text-xs text-slate-400 hover:text-white py-2 transition"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
