"use client";

import { Home, Receipt, ScanLine, User, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/bills", label: "My Bills", icon: Receipt },
  { href: "/friends", label: "Friends", icon: Users },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomTabBar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleScan = () => {
    router.push("/scan");
  };

  return (
    <div className="sticky bottom-0 z-30 border-t-2 border-navy/5 dark:border-white/10 bg-white/95 dark:bg-navy/95 backdrop-blur-sm">
      <div className="relative flex items-center justify-between px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {tabs.slice(0, 2).map((tab) => (
          <TabLink key={tab.href} tab={tab} active={pathname.startsWith(tab.href)} />
        ))}

        <div className="w-16" />

        {tabs.slice(2).map((tab) => (
          <TabLink key={tab.href} tab={tab} active={pathname.startsWith(tab.href)} />
        ))}

        <button
          onClick={handleScan}
          aria-label="Scan receipt"
          className="absolute left-1/2 -top-6 -translate-x-1/2 flex h-16 w-16 items-center justify-center rounded-full bg-skyblue border-4 border-white dark:border-navy-dark shadow-lg active:scale-95 transition-transform"
        >
          <ScanLine className="text-white" size={26} />
        </button>
      </div>
    </div>
  );
}

function TabLink({
  tab,
  active,
}: {
  tab: { href: string; label: string; icon: typeof Home };
  active: boolean;
}) {
  const Icon = tab.icon;
  return (
    <Link
      href={tab.href}
      className={cn(
        "flex flex-col items-center gap-1 px-2 py-1 transition-opacity",
        active ? "opacity-100" : "opacity-25"
      )}
    >
      <Icon size={22} className={active ? "text-skyblue" : "text-navy dark:text-white"} strokeWidth={active ? 2.5 : 2} />
      <span className={cn("text-[10px] font-semibold font-secondary", active ? "text-skyblue" : "text-navy dark:text-white")}>
        {tab.label}
      </span>
    </Link>
  );
}
