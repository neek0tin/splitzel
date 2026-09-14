"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Crown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PretzelIcon } from "@/components/ui/Logo";
import { useAppStore } from "@/store/useAppStore";
import { formatDate } from "@/lib/utils";

const POLL_INTERVAL_MS = 1500;
const MAX_POLLS = 10;

export default function PremiumSuccessPage() {
  const router = useRouter();
  const initialized = useAppStore((s) => s.initialized);
  const hydrate = useAppStore((s) => s.hydrate);
  const user = useAppStore((s) => s.user);
  const refreshUser = useAppStore((s) => s.refreshUser);
  const [pollsLeft, setPollsLeft] = useState(MAX_POLLS);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!initialized || user?.isPremium || pollsLeft <= 0) return;
    const timer = setTimeout(async () => {
      await refreshUser();
      setPollsLeft((n) => n - 1);
    }, POLL_INTERVAL_MS);
    return () => clearTimeout(timer);
  }, [initialized, user?.isPremium, pollsLeft, refreshUser]);

  if (!initialized || !user) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
        <PretzelIcon size={48} className="animate-pulse" />
      </div>
    );
  }

  if (user.isPremium) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-skyblue/15 text-skyblue">
          <CheckCircle2 size={32} />
        </span>
        <div>
          <h1 className="font-primary text-xl font-bold tracking-brand text-navy dark:text-white">
            You&apos;re Premium!
          </h1>
          {user.premiumUntil && (
            <p className="mt-1 text-sm text-navy/60 dark:text-white/60 font-secondary">
              Active until {formatDate(user.premiumUntil)}
            </p>
          )}
        </div>
        <Button fullWidth size="lg" onClick={() => router.push("/home")} className="mt-4 max-w-xs">
          Continue
        </Button>
      </div>
    );
  }

  if (pollsLeft <= 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-orange/15 text-orange">
          <Crown size={28} />
        </span>
        <div>
          <h1 className="font-primary text-xl font-bold tracking-brand text-navy dark:text-white">
            Still confirming your payment
          </h1>
          <p className="mt-1 text-sm text-navy/60 dark:text-white/60 font-secondary">
            This can take a minute. Check back on your Profile shortly — it&apos;ll update automatically once confirmed.
          </p>
        </div>
        <Button fullWidth size="lg" onClick={() => router.push("/profile")} className="mt-4 max-w-xs">
          Back to Profile
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
      <PretzelIcon size={48} className="animate-pulse" />
      <p className="text-sm text-navy/60 dark:text-white/60 font-secondary">Confirming your payment...</p>
    </div>
  );
}
