import { cn } from "@/lib/utils";

export function PretzelIcon({ size = 40, className }: { size?: number; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/logo.svg" width={size} height={size} alt="" className={className} />
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
