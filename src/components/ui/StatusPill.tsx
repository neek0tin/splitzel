import { cn } from "@/lib/utils";

type Status = "settled" | "pending" | "paid";

const config: Record<Status, { label: string; classes: string }> = {
  settled: { label: "SETTLED", classes: "bg-yellow text-navy" },
  paid: { label: "PAID", classes: "bg-yellow text-navy" },
  pending: { label: "PENDING", classes: "bg-orange text-white" },
};

export function StatusPill({ status, className }: { status: Status; className?: string }) {
  const c = config[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-2xl px-3 py-1 text-xs font-bold tracking-wide font-secondary",
        c.classes,
        className
      )}
    >
      {c.label}
    </span>
  );
}
