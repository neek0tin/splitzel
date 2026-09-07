"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { getUserBalance } from "@/lib/aggregates";
import { formatCurrency } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { SplitListItem } from "@/components/SplitListItem";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default function HomePage() {
  const user = useAppStore((s) => s.user);
  const splits = useAppStore((s) => s.splits);

  const balance = useMemo(() => getUserBalance(splits), [splits]);
  const recentSplits = useMemo(() => [...splits].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 5), [splits]);

  if (!user) return null;
  const displayName = user.firstName || "there";

  return (
    <div className="flex flex-col pb-8">
      <div className="flex items-center justify-between px-6 pt-6">
        <div>
          <p className="text-sm text-navy/50 dark:text-white/50 font-secondary">{getGreeting()},</p>
          <h1 className="font-primary text-xl font-bold tracking-brand text-navy dark:text-white">{displayName}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-cream dark:bg-surface-dark border-2 border-navy/10 dark:border-white/10">
            <Bell size={18} className="text-navy dark:text-white" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-orange" />
          </button>
          <Link href="/profile">
            <Avatar name={displayName} color="#192F4D" size="sm" />
          </Link>
        </div>
      </div>

      <div className="px-6 pt-6">
        <div className="rounded-2xl bg-navy p-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/50 font-secondary">
            Splitzel Balance
          </p>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-white/60 font-secondary">You Owe</p>
              <p className="mt-1 font-primary text-2xl font-extrabold tracking-brand text-orange">
                {formatCurrency(balance.owe)}
              </p>
            </div>
            <div className="h-10 w-px bg-white/15" />
            <div className="text-right">
              <p className="text-xs text-white/60 font-secondary">Owed to You</p>
              <p className="mt-1 font-primary text-2xl font-extrabold tracking-brand text-yellow">
                {formatCurrency(balance.owed)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 px-6">
        <div className="flex items-center justify-between">
          <h2 className="font-primary text-lg font-bold tracking-brand text-navy dark:text-white">Recent Splits</h2>
          <Link href="/bills" className="text-sm font-semibold text-skyblue font-secondary">
            See all
          </Link>
        </div>

        <div className="mt-4 flex flex-col gap-3">
          {recentSplits.map((split) => (
            <SplitListItem key={split.id} split={split} />
          ))}
        </div>
      </div>
    </div>
  );
}
