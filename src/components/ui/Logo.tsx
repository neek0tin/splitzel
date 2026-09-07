import { cn } from "@/lib/utils";

export function PretzelIcon({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14 34C8 34 4 30 4 25C4 20 8 16 13 16C17 16 19.5 18.5 22 22L26 28C28.5 31.5 31 34 35 34C40 34 44 30 44 25C44 20 40 16 35 16C31 16 28.5 18.5 26 22"
        stroke="#5AAFED"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M26 22L30.5 14"
        stroke="#5AAFED"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path d="M25 12L30.5 14L28 19" stroke="#5AAFED" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SplitzelLogo({ size = "md", className }: { size?: "sm" | "md" | "lg"; className?: string }) {
  const dims = { sm: { icon: 28, text: "text-xl" }, md: { icon: 40, text: "text-3xl" }, lg: { icon: 56, text: "text-4xl" } };
  const d = dims[size];
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <PretzelIcon size={d.icon} />
      <span className={cn("font-primary font-extrabold tracking-brand text-navy dark:text-white", d.text)}>
        Splitzel
      </span>
    </div>
  );
}
