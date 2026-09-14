"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, ReceiptText, RefreshCw, Sparkles, Wallet } from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PretzelIcon } from "@/components/ui/Logo";
import { useAppStore } from "@/store/useAppStore";
import { formatDate } from "@/lib/utils";

const PREMIUM_PRICE_PHP = 49;

const BENEFITS = [
  { icon: ReceiptText, text: "AI-powered receipt scanning" },
  { icon: RefreshCw, text: "Automatic adjustments when a bill changes" },
  { icon: Wallet, text: "Advanced reimbursement tracking" },
  { icon: Sparkles, text: "Unlimited bill-splitting sessions" },
];

export default function PremiumPage() {
  const router = useRouter();
  const initialized = useAppStore((s) => s.initialized);
  const hydrate = useAppStore((s) => s.hydrate);
  const user = useAppStore((s) => s.user);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!initialized || !user) {
    return (
      <div className="flex flex-1 flex-col">
        <ScreenHeader title="Splitzel Premium" onBack={() => router.push("/profile")} />
        <div className="flex flex-1 items-center justify-center">
          <PretzelIcon size={40} className="animate-pulse" />
        </div>
      </div>
    );
  }

  const handleSubscribe = async () => {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch("/api/premium/checkout", { method: "POST" });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Couldn't start checkout.");
      window.location.href = body.checkoutUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't start checkout. Please try again.");
      setStarting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader title="Splitzel Premium" onBack={() => router.push("/profile")} />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="flex flex-col items-center gap-2 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-skyblue/15 text-skyblue">
            <Crown size={26} />
          </span>
          <h1 className="font-primary text-xl font-bold tracking-brand text-navy dark:text-white">
            {user.isPremium ? "You're a Premium member" : "Go Premium"}
          </h1>
          {user.isPremium && user.premiumUntil && (
            <p className="text-sm text-navy/60 dark:text-white/60 font-secondary">
              Active until {formatDate(user.premiumUntil)}
            </p>
          )}
        </div>

        <Card outlined className="mt-6">
          <div className="flex flex-col gap-3">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-skyblue/15 text-skyblue">
                  <Icon size={16} />
                </span>
                <p className="text-sm font-semibold text-navy dark:text-white font-secondary">{text}</p>
              </div>
            ))}
          </div>
        </Card>

        <p className="mt-4 text-center text-xs text-navy/40 dark:text-white/40 font-secondary">
          Free accounts keep basic bill-splitting and payment tracking, no time limit.
        </p>

        {error && <p className="mt-4 text-center text-sm text-orange font-secondary">{error}</p>}
      </div>

      <div className="px-6 pb-8 pt-2">
        <Button fullWidth size="lg" disabled={starting} onClick={handleSubscribe}>
          {starting
            ? "Starting checkout..."
            : user.isPremium
              ? `Renew — ₱${PREMIUM_PRICE_PHP}/month`
              : `Subscribe — ₱${PREMIUM_PRICE_PHP}/month`}
        </Button>
        <p className="mt-2 text-center text-xs text-navy/40 dark:text-white/40 font-secondary">
          Billed month-to-month via PayMongo. No auto-renewal — you&apos;ll pay again each month you want to stay Premium.
        </p>
      </div>
    </div>
  );
}
