"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SplitzelLogo } from "@/components/ui/Logo";
import { useAppStore } from "@/store/useAppStore";

export default function SplashPage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

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

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-8">
      <div className="flex flex-col items-center gap-4">
        <SplitzelLogo size="lg" />
        <p className="text-sm font-semibold text-navy/60 dark:text-white/60 tracking-brand">
          Tie the Bills Up.
        </p>
      </div>

      <div className="mt-6 h-2 w-40 overflow-hidden rounded-2xl bg-navy/10 dark:bg-white/10">
        <div
          className="h-full rounded-2xl bg-skyblue transition-[width] duration-75 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
