"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { notificationsApi } from "@/lib/api-client";
import type { Notification as AppNotification } from "@/types";

/**
 * useNotifications — fetches and manages in-app notifications.
 *
 * Polls /api/notifications/unread-count every 10 seconds for badge updates,
 * and fetches the full list on mount and when the popover is opened.
 * Fires a browser push notification when the unread count increases.
 */

function requestBrowserNotificationPermission() {
  if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}

function fireBrowserNotification(title: string, body: string) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, icon: "/favicon.ico" });
  } catch {
    // Some browsers require a service worker for notifications — silently skip
  }
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const prevUnreadCount = useRef<number | null>(null);

  // Request browser notification permission once on mount
  useEffect(() => {
    requestBrowserNotificationPermission();
  }, []);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationsApi.list();
      const typed = data as unknown as AppNotification[];
      setNotifications(typed);
      setUnreadCount(typed.filter((n) => !n.is_read).length);
    } catch {
      // Silently fail — user might not be logged in yet
    } finally {
      setLoading(false);
    }
  }, []);

  const pollUnreadCount = useCallback(async () => {
    try {
      const { unread_count } = await notificationsApi.unreadCount() as { unread_count: number };
      setUnreadCount((prev) => {
        // Fire a browser push notification if count went up
        if (prevUnreadCount.current !== null && unread_count > prevUnreadCount.current) {
          fireBrowserNotification(
            "HRS — New Notification",
            `You have ${unread_count} unread notification${unread_count !== 1 ? "s" : ""}.`,
          );
          // Refresh full list so the popover shows the latest items
          notificationsApi.list().then((data) => {
            setNotifications(data as unknown as AppNotification[]);
          }).catch(() => {});
        }
        prevUnreadCount.current = unread_count;
        return unread_count;
      });
    } catch {
      // Silent fail
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Poll unread count every 10 seconds
  useEffect(() => {
    const timer = setInterval(pollUnreadCount, 10_000);
    return () => clearInterval(timer);
  }, [pollUnreadCount]);

  const markRead = useCallback(async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));

    try {
      await notificationsApi.markRead(id);
    } catch {
      // Revert on failure
      fetchNotifications();
    }
  }, [fetchNotifications]);

  const markAllRead = useCallback(async () => {
    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);

    try {
      await notificationsApi.markAllRead();
    } catch {
      fetchNotifications();
    }
  }, [fetchNotifications]);

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markRead,
    markAllRead,
  };
}
