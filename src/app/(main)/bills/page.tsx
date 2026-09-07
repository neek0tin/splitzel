"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { getSplitStatus } from "@/lib/aggregates";
import { cn } from "@/lib/utils";
import { SplitListItem } from "@/components/SplitListItem";

type FilterTab = "all" | "pending" | "settled";

export default function BillsPage() {
  const splits = useAppStore((s) => s.splits);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<FilterTab>("all");

  const filtered = useMemo(() => {
    return [...splits]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .filter((s) => s.receipt.establishment.toLowerCase().includes(query.toLowerCase()))
      .filter((s) => (tab === "all" ? true : getSplitStatus(s) === tab));
  }, [splits, query, tab]);

  return (
    <div className="flex flex-col pb-8">
      <div className="px-6 pt-6">
        <h1 className="font-primary text-xl font-bold tracking-brand text-navy dark:text-white">My Bills</h1>

        <div className="mt-4 flex items-center gap-2 rounded-2xl border-2 border-navy/10 dark:border-white/10 bg-white dark:bg-surface-dark px-4 py-3">
          <Search size={18} className="text-navy/40 dark:text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search establishment..."
            className="w-full bg-transparent text-sm text-navy dark:text-white outline-none placeholder:text-navy/25 dark:placeholder:text-white/25 font-secondary"
          />
        </div>

        <div className="mt-4 flex gap-2">
          {(["all", "pending", "settled"] as FilterTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "rounded-2xl px-4 py-2 text-sm font-semibold font-secondary border-2 transition-colors capitalize",
                tab === t
                  ? "bg-navy text-white border-navy dark:bg-skyblue dark:border-skyblue dark:text-navy"
                  : "bg-transparent text-navy/50 border-navy/10 dark:text-white/50 dark:border-white/10"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 px-6">
        {filtered.length === 0 && (
          <p className="mt-10 text-center text-sm text-navy/40 dark:text-white/40 font-secondary">
            No bills found.
          </p>
        )}
        {filtered.map((split) => (
          <SplitListItem key={split.id} split={split} />
        ))}
      </div>
    </div>
  );
}
