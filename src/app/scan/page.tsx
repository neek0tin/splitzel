"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, Sparkles, X, Zap } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { generateMockScannedReceipt } from "@/lib/mockData";

export default function CapturePage() {
  const router = useRouter();
  const startDraftFromReceipt = useAppStore((s) => s.startDraftFromReceipt);
  const [capturing, setCapturing] = useState(false);

  const handleCapture = () => {
    if (capturing) return;
    setCapturing(true);
    setTimeout(() => {
      const receipt = generateMockScannedReceipt();
      startDraftFromReceipt(receipt);
      router.push("/scan/verify");
    }, 1100);
  };

  return (
    <div className="flex flex-1 flex-col bg-navy-dark text-white">
      <div className="flex items-center justify-between px-5 pt-6">
        <button
          onClick={() => router.back()}
          className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 active:scale-95 transition-transform"
        >
          <X size={18} />
        </button>
        <div className="flex items-center gap-1.5 rounded-2xl bg-skyblue/20 px-3 py-1.5">
          <Sparkles size={14} className="text-skyblue" />
          <span className="text-xs font-bold tracking-wide text-skyblue font-secondary">AI-POWERED</span>
        </div>
        <button className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 active:scale-95 transition-transform">
          <Zap size={16} />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-8">
        <div className="relative aspect-[3/4] w-full max-w-[280px]">
          {(["-top-1 -left-1 border-t-2 border-l-2 rounded-tl-2xl", "-top-1 -right-1 border-t-2 border-r-2 rounded-tr-2xl", "-bottom-1 -left-1 border-b-2 border-l-2 rounded-bl-2xl", "-bottom-1 -right-1 border-b-2 border-r-2 rounded-br-2xl"] as const).map(
            (pos) => (
              <span key={pos} className={`absolute h-10 w-10 border-skyblue ${pos}`} />
            )
          )}

          {capturing && (
            <div className="absolute inset-x-0 top-0 h-1 animate-[scan_1.1s_ease-in-out_infinite] bg-skyblue/80" />
          )}

          <div className="flex h-full items-center justify-center">
            <p className="px-6 text-center text-sm text-white/40 font-secondary">
              {capturing ? "Reading receipt..." : "Align receipt within the frame"}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-10 pb-12 pt-4">
        <button className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 active:scale-95 transition-transform">
          <ImageIcon size={20} />
        </button>

        <button
          onClick={handleCapture}
          disabled={capturing}
          className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/80 active:scale-95 transition-transform disabled:opacity-50"
        >
          <span className={`h-16 w-16 rounded-full bg-white ${capturing ? "animate-pulse" : ""}`} />
        </button>

        <div className="h-12 w-12" />
      </div>

      <style>{`
        @keyframes scan {
          0% { transform: translateY(0); }
          50% { transform: translateY(280px); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
