"use client";

import { useState, useEffect, useCallback } from "react";
import { notificationsApi } from "@/lib/api-client";
import { Notification } from "@/types";

/**
 * useNotifications — fetches and manages in-app notifications.
 *
 * Polls /api/notifications/unread-count every 30 seconds for badge updates,
 * and fetches the full list on mount and when the popover is opened.
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationsApi.list();
      const typed = data as unknown as Notification[];
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
      setUnreadCount(unread_count);
    } catch {
      // Silent fail
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Poll unread count every 30 seconds
  useEffect(() => {
    const timer = setInterval(pollUnreadCount, 30_000);
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
