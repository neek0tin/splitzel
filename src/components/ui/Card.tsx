import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  outlined?: boolean;
}

export function Card({ outlined = false, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl bg-white dark:bg-surface-dark p-4",
        outlined ? "border-2 border-navy/10 dark:border-white/10" : "shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
