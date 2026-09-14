"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Crown, Wallet } from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PretzelIcon } from "@/components/ui/Logo";
import { useAppStore } from "@/store/useAppStore";
import { getReimbursementLedger } from "@/lib/aggregates";
import { formatCurrency } from "@/lib/utils";

export default function ReimbursementsPage() {
  const router = useRouter();
  const initialized = useAppStore((s) => s.initialized);
  const hydrate = useAppStore((s) => s.hydrate);
  const user = useAppStore((s) => s.user);
  const splits = useAppStore((s) => s.splits);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!initialized || !user) {
    return (
      <div className="flex flex-1 flex-col">
        <ScreenHeader title="Reimbursements" onBack={() => router.push("/profile")} />
        <div className="flex flex-1 items-center justify-center">
          <PretzelIcon size={40} className="animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user.isPremium) {
    return (
      <div className="flex flex-1 flex-col">
        <ScreenHeader title="Reimbursements" onBack={() => router.push("/profile")} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-skyblue/15 text-skyblue">
            <Crown size={26} />
          </span>
          <div>
            <p className="font-primary text-lg font-bold tracking-brand text-navy dark:text-white">
              Advanced reimbursement tracking is a Premium feature
            </p>
            <p className="mt-1 text-sm text-navy/60 dark:text-white/60 font-secondary">
              See a consolidated view of who owes you — and who you owe — across every split, plus partial payment
              tracking.
            </p>
          </div>
          <Button fullWidth size="lg" onClick={() => router.push("/premium")} className="mt-2 max-w-xs">
            Go Premium
          </Button>
        </div>
      </div>
    );
  }

  const ledger = getReimbursementLedger(splits, user.id);

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader title="Reimbursements" onBack={() => router.push("/profile")} />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <p className="mb-4 text-xs text-navy/50 dark:text-white/50 font-secondary">
          A consolidated view across every split you&apos;re in — not just one at a time.
        </p>

        {ledger.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Wallet size={28} className="text-navy/20 dark:text-white/20" />
            <p className="text-sm text-navy/40 dark:text-white/40 font-secondary">
              All settled up — nothing outstanding.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {ledger.map((entry) => {
              const net = entry.theyOweYou - entry.youOweThem;
              return (
                <Card key={entry.key} outlined>
                  <div className="flex items-center gap-3">
                    <Avatar name={entry.name} color={entry.avatarColor} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-navy dark:text-white font-secondary truncate">
                        {entry.name}
                      </p>
                      <p className="text-xs text-navy/50 dark:text-white/50 font-secondary">
                        {entry.splitCount} split{entry.splitCount > 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-primary text-sm font-bold ${net >= 0 ? "text-skyblue" : "text-orange"}`}
                      >
                        {net >= 0 ? "Owes you " : "You owe "}
                        {formatCurrency(Math.abs(net))}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
