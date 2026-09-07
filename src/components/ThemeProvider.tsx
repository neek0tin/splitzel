"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

export function ThemeProvider() {
  const darkMode = useAppStore((s) => s.darkMode);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return null;
}
