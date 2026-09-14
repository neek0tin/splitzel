"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";

interface Step {
  /** null for the intro step, which has no real button to point at. */
  target: string | null;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    target: null,
    title: "Welcome to Splitzel!",
    description: "Tie up bills with friends in seconds — let's take a quick look around.",
  },
  {
    target: '[data-tutorial="scan-button"]',
    title: "Scan Any Receipt",
    description: "Tap here to snap a photo and let AI read every item for you — or add them by hand.",
  },
  {
    target: '[data-tutorial="tab-bills"]',
    title: "Track Your Splits",
    description: "See every split you're part of here, and who's still got to pay.",
  },
  {
    target: '[data-tutorial="tab-friends"]',
    title: "Connect With Friends",
    description: "Add friends by code or QR so you can split with them anytime.",
  },
  {
    target: '[data-tutorial="tab-profile"]',
    title: "Your Profile",
    description: "Manage your payment info, go Premium, and more.",
  },
];

const SPOTLIGHT_PADDING = 10;

/** Re-measures a target element's on-screen position, live, so the spotlight
 *  tracks it correctly across resizes and any late layout shifts. */
function useTargetRect(selector: string | null) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const measure = () => {
      const el = selector ? document.querySelector(selector) : null;
      setRect(el ? el.getBoundingClientRect() : null);
    };
    measure();
    if (!selector) return;
    // A couple of follow-up measurements catch late layout shifts (fonts,
    // images) without needing a full ResizeObserver for a 5-step tutorial.
    const frame = requestAnimationFrame(measure);
    const t1 = setTimeout(measure, 60);
    const t2 = setTimeout(measure, 300);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
    };
  }, [selector]);

  return rect;
}

export function TutorialOverlay() {
  const dismissTutorial = useAppStore((s) => s.dismissTutorial);
  const [index, setIndex] = useState(0);
  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;
  const rect = useTargetRect(step.target);

  const goNext = () => (isLast ? dismissTutorial() : setIndex((i) => i + 1));

  // Bubble sits just below the spotlight if the target is in the top half of
  // the screen, otherwise just above it -- keeps it clear of the highlighted
  // button regardless of whether that button is near the top or the bottom.
  const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 800;
  const targetInTopHalf = rect ? rect.top < viewportHeight / 2 : false;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop: a plain dim overlay for the intro step, or the spotlight
          cutout (a box-shadow large enough to darken everything outside the
          highlighted rect) once there's a real target. */}
      {rect ? (
        <motion.div
          animate={{
            top: rect.top - SPOTLIGHT_PADDING,
            left: rect.left - SPOTLIGHT_PADDING,
            width: rect.width + SPOTLIGHT_PADDING * 2,
            height: rect.height + SPOTLIGHT_PADDING * 2,
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="pointer-events-none absolute rounded-3xl"
          style={{ boxShadow: "0 0 0 9999px rgba(9, 16, 32, 0.78)" }}
        />
      ) : (
        <div className="absolute inset-0 bg-navy-dark/85" />
      )}

      <button
        onClick={dismissTutorial}
        aria-label="Skip tutorial"
        className="absolute right-5 top-6 flex h-9 w-9 items-center justify-center rounded-2xl bg-white/15 text-white active:scale-95 transition-transform"
      >
        <X size={18} />
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="absolute left-1/2 w-[calc(100%-2.5rem)] max-w-xs -translate-x-1/2 px-1"
          style={
            !rect
              ? { top: "50%", transform: "translate(-50%, -50%)" }
              : targetInTopHalf
                ? { top: rect.bottom + SPOTLIGHT_PADDING + 16 }
                : { bottom: viewportHeight - rect.top + SPOTLIGHT_PADDING + 16 }
          }
        >
          <div className="rounded-2xl bg-white dark:bg-surface-dark p-5 text-center shadow-xl">
            <h2 className="font-primary text-lg font-bold tracking-brand text-navy dark:text-white">{step.title}</h2>
            <p className="mt-1.5 text-sm text-navy/60 dark:text-white/60 font-secondary">{step.description}</p>

            <div className="mt-4 flex items-center justify-center gap-1.5">
              {STEPS.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-5 bg-skyblue" : "w-1.5 bg-navy/15 dark:bg-white/20"
                  }`}
                />
              ))}
            </div>

            <Button fullWidth size="md" onClick={goNext} className="mt-4">
              {isLast ? "Get Started" : "Next"}
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
