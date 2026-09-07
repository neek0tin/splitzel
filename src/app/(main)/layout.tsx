import { BottomTabBar } from "@/components/BottomTabBar";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1">{children}</div>
      <BottomTabBar />
    </div>
  );
}
