"use client";

import { useEffect } from "react";
import { Bell, Check, UserPlus, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { ScreenHeader } from "@/components/ScreenHeader";
import { PretzelIcon } from "@/components/ui/Logo";
import { useAppStore } from "@/store/useAppStore";
import { formatDateTime } from "@/lib/utils";
import type { AppNotification, NotificationType } from "@/types";

const ICONS: Record<NotificationType, typeof Bell> = {
  split_added: UserPlus,
  member_paid: Wallet,
  marked_received: Check,
  nudge: Bell,
};

export default function NotificationsPage() {
  const router = useRouter();
  const initialized = useAppStore((s) => s.initialized);
  const hydrate = useAppStore((s) => s.hydrate);
  const notifications = useAppStore((s) => s.notifications);
  const markNotificationRead = useAppStore((s) => s.markNotificationRead);
  const markAllNotificationsRead = useAppStore((s) => s.markAllNotificationsRead);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleTap = (n: AppNotification) => {
    if (!n.read) markNotificationRead(n.id);
    if (n.splitId) router.push(`/split/${n.splitId}`);
  };

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader
        title="Notifications"
        onBack={() => router.push("/home")}
        right={
          unreadCount > 0 ? (
            <button onClick={() => markAllNotificationsRead()} className="text-skyblue">
              <Check size={20} />
            </button>
          ) : undefined
        }
      />

      {!initialized ? (
        <div className="flex flex-1 items-center justify-center">
          <PretzelIcon size={40} className="animate-pulse" />
        </div>
      ) : (
        <div className="flex-1 px-6 py-6">
          {notifications.length === 0 && (
            <div className="mt-16 flex flex-col items-center gap-2 text-center">
              <Bell size={28} className="text-navy/20 dark:text-white/20" />
              <p className="text-sm text-navy/40 dark:text-white/40 font-secondary">
                Nothing yet. Split activity and reminders will show up here.
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {notifications.map((n) => {
              const Icon = ICONS[n.type];
              return (
                <button
                  key={n.id}
                  onClick={() => handleTap(n)}
                  className={`flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-colors ${
                    n.read
                      ? "border-navy/10 dark:border-white/10 bg-white dark:bg-surface-dark"
                      : "border-skyblue/40 bg-skyblue/5 dark:bg-skyblue/10"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl ${
                      n.read ? "bg-cream dark:bg-navy text-navy/60 dark:text-white/60" : "bg-skyblue/20 text-skyblue"
                    }`}
                  >
                    <Icon size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-primary text-sm font-bold tracking-brand text-navy dark:text-white">
                        {n.title}
                      </p>
                      {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-orange" />}
                    </div>
                    <p className="mt-0.5 text-sm text-navy/60 dark:text-white/60 font-secondary">{n.body}</p>
                    <p className="mt-1 text-xs text-navy/35 dark:text-white/35 font-secondary">
                      {formatDateTime(n.createdAt)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
