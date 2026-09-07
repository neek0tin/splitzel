import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className, id, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-semibold text-navy/70 dark:text-white/70 font-secondary">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          "rounded-2xl border-2 border-navy/15 dark:border-white/15 bg-white dark:bg-surface-dark px-4 py-3 text-navy dark:text-white font-secondary outline-none transition-colors",
          "focus:border-skyblue placeholder:text-navy/25 dark:placeholder:text-white/25",
          className
        )}
        {...props}
      />
    </div>
  );
}
