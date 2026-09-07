"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ListChecks, Scale } from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { useAppStore } from "@/store/useAppStore";
import { cn } from "@/lib/utils";
import type { SplitMethod } from "@/types";

export default function ChooseMethodPage() {
  const router = useRouter();
  const receipt = useAppStore((s) => s.draft.receipt);
  const setDraftMethod = useAppStore((s) => s.setDraftMethod);

  useEffect(() => {
    if (!receipt) router.replace("/scan");
  }, [receipt, router]);

  if (!receipt) return null;

  const choose = (method: SplitMethod) => {
    setDraftMethod(method);
    router.push("/scan/assign");
  };

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader title="Choose Split Method" onBack={() => router.push("/scan/verify")} />

      <div className="flex-1 px-6 py-6">
        <p className="mb-6 text-sm text-navy/60 dark:text-white/60 font-secondary">
          How should <span className="font-bold text-navy dark:text-white">{receipt.establishment}</span>&apos;s bill be
          split?
        </p>

        <div className="flex flex-col gap-4">
          <MethodCard
            icon={<ListChecks size={22} />}
            title="Split by Item"
            description="Each person pays only for what they ordered, plus their share of tax and service charge."
            onClick={() => choose("item")}
          />
          <MethodCard
            icon={<Scale size={22} />}
            title="Split Evenly"
            description="The total bill is divided equally among all group members."
            onClick={() => choose("even")}
          />
        </div>
      </div>
    </div>
  );
}

function MethodCard({
  icon,
  title,
  description,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-start gap-3 rounded-2xl border-2 border-navy/10 dark:border-white/10 bg-white dark:bg-surface-dark p-5 text-left",
        "active:scale-[0.98] active:border-skyblue transition-all"
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-skyblue/15 text-skyblue">
        {icon}
      </span>
      <p className="font-primary text-base font-bold tracking-brand text-navy dark:text-white">{title}</p>
      <p className="text-sm text-navy/60 dark:text-white/60 font-secondary">{description}</p>
    </button>
  );
}
