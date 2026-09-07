"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BottomTabBar } from "@/components/BottomTabBar";
import { PretzelIcon } from "@/components/ui/Logo";
import { useAppStore } from "@/store/useAppStore";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const initialized = useAppStore((s) => s.initialized);
  const hydrate = useAppStore((s) => s.hydrate);
  const hasName = useAppStore((s) => !!s.user?.firstName);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (initialized && !hasName) router.replace("/register");
  }, [initialized, hasName, router]);

  if (!initialized || !hasName) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <PretzelIcon size={40} className="animate-pulse" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1">{children}</div>
      <BottomTabBar />
    </div>
  );
}
