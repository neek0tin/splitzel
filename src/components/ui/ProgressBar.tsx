import { cn } from "@/lib/utils";

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2.5 w-full rounded-2xl bg-navy/10 dark:bg-white/10 overflow-hidden", className)}>
      <div
        className="h-full rounded-2xl bg-skyblue transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
