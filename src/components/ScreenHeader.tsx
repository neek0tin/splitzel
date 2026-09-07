"use client";

import { ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

export function ScreenHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  const router = useRouter();
  return (
    <div className="sticky top-0 z-20 flex items-center justify-between bg-white/95 dark:bg-navy-dark/95 backdrop-blur-sm px-5 py-4 border-b-2 border-navy/5 dark:border-white/10">
      <button
        onClick={onBack ?? (() => router.back())}
        className="flex h-9 w-9 items-center justify-center rounded-2xl border-2 border-navy/15 dark:border-white/20 text-navy dark:text-white active:scale-95 transition-transform"
      >
        <ChevronLeft size={20} />
      </button>
      <h1 className="font-primary text-lg font-bold tracking-brand text-navy dark:text-white">{title}</h1>
      <div className="w-9">{right}</div>
    </div>
  );
}
