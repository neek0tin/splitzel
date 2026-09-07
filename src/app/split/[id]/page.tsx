"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock } from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { StatusPill } from "@/components/ui/StatusPill";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Button } from "@/components/ui/Button";
import { PretzelIcon } from "@/components/ui/Logo";
import { SettleUpModal } from "@/components/SettleUpModal";
import { useAppStore } from "@/store/useAppStore";
import { getOverdueDays, getPaidCount, getShareForMember, getSplitStatus } from "@/lib/aggregates";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function SplitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const initialized = useAppStore((s) => s.initialized);
  const hydrate = useAppStore((s) => s.hydrate);
  const splits = useAppStore((s) => s.splits);
  const friends = useAppStore((s) => s.friends);
  const markMemberPaid = useAppStore((s) => s.markMemberPaid);

  const [settleOpen, setSettleOpen] = useState(false);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const split = splits.find((s) => s.id === id);

  const shares = useMemo(() => (split ? split.members.map((m) => getShareForMember(split, m.id)) : []), [split]);

  if (!initialized) {
    return (
      <div className="flex flex-1 flex-col">
        <ScreenHeader title="Split Summary" onBack={() => router.push("/bills")} />
        <div className="flex flex-1 items-center justify-center">
          <PretzelIcon size={40} className="animate-pulse" />
        </div>
      </div>
    );
  }

  if (!split) {
    return (
      <div className="flex flex-1 flex-col">
        <ScreenHeader title="Split" onBack={() => router.push("/bills")} />
        <div className="flex flex-1 items-center justify-center px-6">
          <p className="text-sm text-navy/50 dark:text-white/50 font-secondary">This split could not be found.</p>
        </div>
      </div>
    );
  }

  const status = getSplitStatus(split);
  const { paid, total } = getPaidCount(split);
  const overdueDays = getOverdueDays(split);
  const isPayee = split.payeeFriendId === null;
  const me = split.members.find((m) => m.isCurrentUser);
  const payee = friends.find((f) => f.id === split.payeeFriendId) ?? null;

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader title="Split Summary" onBack={() => router.push("/bills")} />

      <div className="flex-1 px-6 py-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-primary text-xl font-bold tracking-brand text-navy dark:text-white">
              {split.receipt.establishment}
            </p>
            <p className="mt-0.5 text-xs text-navy/50 dark:text-white/50 font-secondary">
              {formatDate(split.createdAt)} &middot; {split.method === "item" ? "Split by Item" : "Split Evenly"}
            </p>
          </div>
          <StatusPill status={status} />
        </div>

        <Card outlined className="mt-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-navy/40 dark:text-white/40 font-secondary">
              Group Progress
            </span>
            <span className="text-xs font-semibold text-navy/60 dark:text-white/60 font-secondary">
              {paid}/{total} paid
            </span>
          </div>
          <ProgressBar value={(paid / total) * 100} className="mt-3" />
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-navy/50 dark:text-white/50 font-secondary">Grand Total</span>
            <span className="font-primary font-bold text-navy dark:text-white">{formatCurrency(split.receipt.total)}</span>
          </div>
        </Card>

        {overdueDays > 0 && status === "pending" && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border-2 border-orange/40 bg-orange/10 px-4 py-3">
            <Clock size={16} className="text-orange shrink-0" />
            <p className="text-xs font-semibold text-orange font-secondary">
              Overdue by {overdueDays} day{overdueDays > 1 ? "s" : ""} &mdash; +₱5/day Late Penalty applies to unpaid shares.
            </p>
          </div>
        )}

        <div className="mt-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-navy/40 dark:text-white/40 font-secondary">
            Members
          </p>
          <div className="flex flex-col gap-3">
            {split.members.map((m) => {
              const share = shares.find((s) => s?.memberId === m.id);
              const canReceive = isPayee && !m.isCurrentUser && m.status === "pending";
              return (
                <Card key={m.id} outlined>
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name} color={m.avatarColor} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-navy dark:text-white font-secondary truncate">
                        {m.isCurrentUser ? "You" : m.name}
                      </p>
                      <p className="text-xs text-navy/50 dark:text-white/50 font-secondary">
                        {formatCurrency(share?.total ?? 0)}
                        {(share?.lateFee ?? 0) > 0 && <span className="text-orange"> incl. late fee</span>}
                      </p>
                    </div>
                    {m.status === "paid" ? (
                      <CheckCircle2 size={20} className="text-yellow shrink-0" />
                    ) : (
                      <StatusPill status="pending" />
                    )}
                  </div>
                  {canReceive && (
                    <button
                      onClick={() => markMemberPaid(split.id, m.id)}
                      className="mt-3 w-full rounded-2xl border-2 border-navy/15 dark:border-white/20 py-2 text-xs font-semibold text-navy dark:text-white active:scale-95 transition-transform"
                    >
                      Mark as Received
                    </button>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {!isPayee && me?.status === "pending" && (
        <div className="sticky bottom-0 z-20 border-t-2 border-navy/5 dark:border-white/10 bg-white dark:bg-navy-dark px-6 py-4">
          <Button fullWidth size="lg" onClick={() => setSettleOpen(true)}>
            Settle Up
          </Button>
        </div>
      )}

      <SettleUpModal
        open={settleOpen}
        onClose={() => setSettleOpen(false)}
        split={split}
        memberId={me?.id ?? ""}
        payee={payee}
        onSettled={() => me && markMemberPaid(split.id, me.id)}
      />
    </div>
  );
}
