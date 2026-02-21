'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { mockNotifications } from '@/lib/mock-data';
import { Clock } from 'lucide-react';

interface NotificationsSidebarProps {
    open: boolean;
    onClose: () => void;
}

export function NotificationsSidebar({ open, onClose }: NotificationsSidebarProps) {
    const notifications = mockNotifications;
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
                    {notifications.length === 0 ? (
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
