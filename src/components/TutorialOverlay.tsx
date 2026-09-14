"use client";

import { useState } from "react";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import { Receipt, Sparkles, Users, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";

const SLIDES = [
  {
    icon: Sparkles,
    title: "Welcome to Splitzel!",
    description: "Tie up bills with friends in seconds — built for Filipino college life.",
  },
  {
    icon: Receipt,
    title: "Scan Any Receipt",
    description: "Snap a photo and let AI read every item for you, or add them by hand — your call.",
  },
  {
    icon: Users,
    title: "Split However You Like",
    description: "Divide evenly, or assign exactly what each person ordered.",
  },
  {
    icon: Wallet,
    title: "Stay on Top of Payments",
    description: "See who's paid, send a reminder, and settle up via GCash — all in the app.",
  },
  {
    icon: Sparkles,
    title: "You're All Set!",
    description: "Let's split your first bill.",
  },
] as const;

const SWIPE_THRESHOLD = 60;

export function TutorialOverlay() {
  const dismissTutorial = useAppStore((s) => s.dismissTutorial);
  const [[index, direction], setSlide] = useState<[number, number]>([0, 0]);
  const isLast = index === SLIDES.length - 1;

  const goTo = (target: number) => {
    const clamped = Math.max(0, Math.min(SLIDES.length - 1, target));
    if (clamped === index) return;
    setSlide([clamped, clamped > index ? 1 : -1]);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD) goTo(index + 1);
    else if (info.offset.x > SWIPE_THRESHOLD) goTo(index - 1);
  };

  const slide = SLIDES[index];
  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white dark:bg-navy-dark">
      <div className="flex justify-end px-5 pt-6">
        <button
          onClick={dismissTutorial}
          aria-label="Skip tutorial"
          className="flex h-9 w-9 items-center justify-center rounded-2xl bg-navy/5 dark:bg-white/10 text-navy dark:text-white active:scale-95 transition-transform"
        >
          <X size={18} />
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ x: direction > 0 ? 80 : -80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: direction > 0 ? -80 : 80, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            className="absolute flex flex-col items-center gap-6 px-10 text-center"
          >
            <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-skyblue/15 text-skyblue">
              <Icon size={36} />
            </span>
            <div>
              <h1 className="font-primary text-2xl font-bold tracking-brand text-navy dark:text-white">
                {slide.title}
              </h1>
              <p className="mt-2 text-sm text-navy/60 dark:text-white/60 font-secondary">{slide.description}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center gap-2 pb-6">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-6 bg-skyblue" : "w-2 bg-navy/15 dark:bg-white/20"
            }`}
          />
        ))}
      </div>

      <div className="px-6 pb-8">
        <Button fullWidth size="lg" onClick={() => (isLast ? dismissTutorial() : goTo(index + 1))}>
          {isLast ? "Get Started" : "Next"}
        </Button>
      </div>
    </div>
  );
}
