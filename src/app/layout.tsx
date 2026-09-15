import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const primaryFont = localFont({
  variable: "--font-primary-raw",
  src: [
    { path: "../fonts/montserrat-arabic/Montserrat-Arabic-SemiBold-600.otf", weight: "600", style: "normal" },
    { path: "../fonts/montserrat-arabic/Montserrat-Arabic-Bold-700.otf", weight: "700", style: "normal" },
    { path: "../fonts/montserrat-arabic/Montserrat-Arabic-ExtraBold-800.otf", weight: "800", style: "normal" },
  ],
});

const secondaryFont = localFont({
  variable: "--font-secondary-raw",
  src: [
    { path: "../fonts/basis-grotesque-arabic/BasisGrotesqueArabicPro-Regular-400.ttf", weight: "400", style: "normal" },
    { path: "../fonts/basis-grotesque-arabic/BasisGrotesqueArabicPro-Medium-500.ttf", weight: "500", style: "normal" },
    { path: "../fonts/basis-grotesque-arabic/BasisGrotesqueArabicPro-Bold-700.ttf", weight: "700", style: "normal" },
  ],
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
