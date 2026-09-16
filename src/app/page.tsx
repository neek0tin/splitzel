"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { PretzelFillIcon, SplitzelLogo } from "@/components/ui/Logo";
import { useAppStore } from "@/store/useAppStore";
import { isReturningUser } from "@/lib/utils";

// localStorage never changes from outside this page while it's mounted, so the
// subscription itself is a no-op — this is purely to get an SSR-safe read (via
// getServerSnapshot) of client-only state without the flash a "read it in an
// effect" approach would cause on hydration.
function subscribeNoop() {
  return () => {};
}
function getServerSnapshot() {
  return false;
}

export default function SplashPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const returning = useSyncExternalStore(subscribeNoop, isReturningUser, getServerSnapshot);

  useEffect(() => {
    const start = Date.now();
    const duration = 1600;
    let cancelled = false;

    const tick = () => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, (elapsed / duration) * 100);
      setProgress(pct);
      if (pct < 100) requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);

    useAppStore
      .getState()
      .hydrate()
      .then((user) => {
        if (cancelled) return;
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, duration + 200 - elapsed);
        setTimeout(() => {
          if (!cancelled) router.replace(user?.firstName ? "/home" : "/register");
        }, remaining);
      });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [router]);

  if (returning) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-8">
        <PretzelFillIcon size={160} progress={progress} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8">
      <div className="flex flex-col items-center gap-1">
        <SplitzelLogo size="lg" />
        <p className="text-sm font-semibold text-navy/60 dark:text-white/60 tracking-brand">
          Tie the Bills Up.
        </p>
      </div>
    </div>
  );
}
