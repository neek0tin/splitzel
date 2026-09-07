import type { Metadata, Viewport } from "next";
import { Syne, Space_Grotesk } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const primaryFont = Syne({
  variable: "--font-primary-raw",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

const secondaryFont = Space_Grotesk({
  variable: "--font-secondary-raw",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Splitzel — Tie the Bills Up",
  description: "Split bills effortlessly with friends. Built for Filipino college students.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#192F4D",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${primaryFont.variable} ${secondaryFont.variable}`}>
      <body className="bg-cream text-navy dark:bg-navy-dark dark:text-white transition-colors duration-300">
        <ThemeProvider />
        <div className="max-w-md mx-auto min-h-screen relative shadow-2xl flex flex-col justify-between overflow-x-hidden bg-white dark:bg-navy-dark">
          {children}
        </div>
      </body>
    </html>
  );
}
