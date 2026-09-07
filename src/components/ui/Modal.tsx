"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-navy/50"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative w-full max-w-md max-h-[88vh] overflow-y-auto rounded-t-2xl bg-white dark:bg-surface-dark px-5 pt-4 pb-8"
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-navy/15 dark:bg-white/20" />
            {title && (
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-primary text-xl font-bold tracking-brand text-navy dark:text-white">{title}</h2>
                <button
                  onClick={onClose}
                  className="rounded-full p-1.5 text-navy/50 hover:bg-navy/5 dark:text-white/60 dark:hover:bg-white/10"
                >
                  <X size={20} />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
