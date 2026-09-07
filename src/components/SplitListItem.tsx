"use client";

import { useRouter } from "next/navigation";
import { getSplitStatus } from "@/lib/aggregates";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Split } from "@/types";
import { StatusPill } from "@/components/ui/StatusPill";
import { Card } from "@/components/ui/Card";

export function SplitListItem({ split }: { split: Split }) {
  const router = useRouter();
  const status = getSplitStatus(split);

  return (
    <Card
      outlined
      onClick={() => router.push(`/split/${split.id}`)}
      className="cursor-pointer active:scale-[0.98] transition-transform"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-primary text-base font-bold tracking-brand text-navy dark:text-white truncate">
            {split.receipt.establishment}
          </p>
          <p className="mt-0.5 text-xs text-navy/50 dark:text-white/50 font-secondary">
            {formatDate(split.createdAt)} &middot; {split.members.length} people
          </p>
        </div>
        <StatusPill status={status} />
      </div>
      <div className="mt-3 flex items-end justify-between">
        <span className="text-xs font-semibold text-navy/40 dark:text-white/40 font-secondary">Total Bill</span>
        <span className="font-primary text-lg font-bold text-navy dark:text-white">
          {formatCurrency(split.receipt.total)}
        </span>
      </div>
    </Card>
  );
}
