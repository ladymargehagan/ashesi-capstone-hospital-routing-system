"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotifications } from "@/hooks/use-notifications";
import { Notification } from "@/types";
import {
  Bell,
  CheckCircle2,
  XCircle,
  FileText,
  Building2,
  UserCheck,
  UserX,
  AlertTriangle,
  Loader2,
  CheckCheck,
  LucideIcon,
} from "lucide-react";

// Map notification types to Lucide icons and colors
const TYPE_META: Record<
  string,
  { icon: LucideIcon; color: string; label: string }
> = {
  referral_created:        { icon: FileText,      color: "text-blue-500",   label: "New Referral" },
  referral_approved:       { icon: CheckCircle2,  color: "text-green-500",  label: "Referral Accepted" },
  referral_rejected:       { icon: XCircle,       color: "text-red-500",    label: "Referral Rejected" },
  referral_completed:      { icon: CheckCheck,    color: "text-green-600",  label: "Referral Completed" },
  referral_cancelled:      { icon: XCircle,       color: "text-gray-500",   label: "Referral Cancelled" },
  referral_status_changed: { icon: FileText,      color: "text-blue-400",   label: "Referral Updated" },
  hospital_approval:       { icon: Building2,     color: "text-purple-500", label: "Hospital Approved" },
  hospital_rejection:      { icon: Building2,     color: "text-red-500",    label: "Hospital Rejected" },
  physician_verification:  { icon: UserCheck,     color: "text-green-500",  label: "Account Approved" },
  physician_rejection:     { icon: UserX,         color: "text-red-500",    label: "Account Rejected" },
  account_approved:        { icon: UserCheck,     color: "text-green-500",  label: "Account Approved" },
  data_flagged:            { icon: AlertTriangle, color: "text-yellow-500", label: "Data Flagged" },
  patient_arrived:         { icon: CheckCircle2,  color: "text-teal-500",   label: "Patient Arrived" },
};

function getTypeMeta(type: string) {
  return TYPE_META[type] ?? { icon: Bell, color: "text-gray-400", label: type };
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface NotificationRowProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
}

function NotificationRow({ notification: n, onMarkRead }: NotificationRowProps) {
  const meta = getTypeMeta(n.type);
  const Icon = meta.icon;

  return (
    <button
      onClick={() => !n.is_read && onMarkRead(n.id)}
      className={`flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors hover:bg-accent/60 ${
        !n.is_read ? "bg-blue-50/60" : ""
      }`}
    >
      <div className={`mt-0.5 shrink-0 ${meta.color}`}>
        <Icon size={17} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-sm leading-snug ${!n.is_read ? "font-semibold text-foreground" : "text-foreground/80"}`}>
          {n.message}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {meta.label} · {timeAgo(n.created_at)}
        </p>
      </div>
      {!n.is_read && (
        <span className="mt-2 size-2 shrink-0 rounded-full bg-blue-500" />
      )}
    </button>
  );
}

export function NotificationInboxPopover() {
  const { notifications, unreadCount, loading, fetchNotifications, markRead, markAllRead } =
    useNotifications();
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [open, setOpen] = useState(false);

  const filtered =
    tab === "unread" ? notifications.filter((n) => !n.is_read) : notifications;

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen) fetchNotifications();
  };

  return (
    <Popover open={open} onOpenChange={handleOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Open notifications"
        >
          <Bell className="h-5 w-5 text-gray-600" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" sideOffset={8} className="w-[380px] p-0">
        {/* Header */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as "all" | "unread")}>
          <div className="flex items-center justify-between border-b px-4 py-2.5">
            <TabsList className="bg-transparent p-0 gap-1">
              <TabsTrigger value="all" className="text-sm px-3 py-1.5">
                All
              </TabsTrigger>
              <TabsTrigger value="unread" className="text-sm px-3 py-1.5">
                Unread
                {unreadCount > 0 && (
                  <Badge className="ml-1.5 h-4 min-w-4 px-1 text-[10px]">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                <CheckCheck size={13} />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Bell className="mb-3 h-10 w-10 opacity-40" />
                <p className="text-sm">
                  {tab === "unread" ? "No unread notifications" : "No notifications yet"}
                </p>
              </div>
            ) : (
              filtered.map((n) => (
                <NotificationRow key={n.id} notification={n} onMarkRead={markRead} />
              ))
            )}
          </div>
        </Tabs>

        {/* Footer */}
        <div className="border-t px-4 py-2.5">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground hover:text-foreground"
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
