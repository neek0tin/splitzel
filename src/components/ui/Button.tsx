"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  icon?: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-navy text-white hover:bg-navy/90 active:bg-navy/80 dark:bg-skyblue dark:text-navy",
  secondary: "bg-skyblue text-navy hover:bg-skyblue/90 active:bg-skyblue/80",
  outline: "bg-transparent text-navy border-2 border-navy hover:bg-navy/5 dark:text-white dark:border-white",
  ghost: "bg-transparent text-navy hover:bg-navy/5 dark:text-white dark:hover:bg-white/10",
  danger: "bg-orange text-white hover:bg-orange/90",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm px-4 py-2",
  md: "text-base px-5 py-3",
  lg: "text-base px-6 py-4",
};

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  icon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "rounded-2xl font-semibold font-secondary transition-all duration-150 active:scale-[0.97] flex items-center justify-center gap-2",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        disabled && "opacity-25 pointer-events-none",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
