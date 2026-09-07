import { cn } from "@/lib/utils";

export function Switch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={cn(
        "relative h-7 w-12 rounded-2xl border-2 transition-colors duration-200",
        checked ? "bg-skyblue border-skyblue" : "bg-transparent border-navy/25 dark:border-white/25"
      )}
    >
      <span
        className={cn(
          "absolute left-0.5 top-0.5 h-5 w-5 rounded-full shadow transition-transform duration-200",
          checked ? "translate-x-5 bg-white" : "translate-x-0 bg-navy/40 dark:bg-white/40"
        )}
      />
    </button>
  );
}
