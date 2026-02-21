'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { notificationsApi } from '@/lib/api-client';
import { Notification } from '@/types';
import { Clock, Loader2 } from 'lucide-react';

interface NotificationsSidebarProps {
    open: boolean;
    onClose: () => void;
}

export function NotificationsSidebar({ open, onClose }: NotificationsSidebarProps) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        notificationsApi.list()
            .then((data) => setNotifications(data as unknown as Notification[]))
            .catch(() => setNotifications([]))
            .finally(() => setLoading(false));
    }, [open]);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent className="w-80">
                <SheetHeader>
                    <SheetTitle>Notifications</SheetTitle>
                    <p className="text-sm text-gray-500">
                        You have {unreadCount} unread notifications
                    </p>
                </SheetHeader>

                <div className="mt-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <Clock className="h-12 w-12 mb-4" />
                            <p>No notifications</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-3 rounded-lg border ${notification.is_read ? 'bg-white' : 'bg-blue-50 border-blue-100'
                                        }`}
                                >
                                    <p className="font-medium text-sm">{notification.type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
                                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        {new Date(notification.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
