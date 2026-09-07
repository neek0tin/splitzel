import { cn, initials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  color?: string;
  size?: "xs" | "sm" | "md" | "lg";
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

const sizeClasses: Record<string, string> = {
  xs: "w-7 h-7 text-[10px]",
  sm: "w-9 h-9 text-xs",
  md: "w-11 h-11 text-sm",
  lg: "w-16 h-16 text-lg",
};

export function Avatar({ name, color, size = "md", selected, onClick, className }: AvatarProps) {
  const bg = color ?? "#5AAFED";
  const classes = cn(
    "rounded-full flex items-center justify-center font-bold text-white font-secondary shrink-0 transition-all duration-150",
    sizeClasses[size],
    onClick && "cursor-pointer active:scale-95",
    selected !== undefined && (selected ? "ring-2 ring-offset-2 ring-navy dark:ring-skyblue dark:ring-offset-navy-dark opacity-100" : "opacity-25"),
    className
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={classes} style={{ backgroundColor: bg }}>
        {initials(name)}
      </button>
    );
  }

  return (
    <div className={classes} style={{ backgroundColor: bg }}>
      {initials(name)}
    </div>
  );
}
