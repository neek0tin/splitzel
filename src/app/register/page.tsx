"use client";

import { useRouter } from "next/navigation";
import { Receipt, ShieldCheck, Users } from "lucide-react";
import { SplitzelLogo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

const features = [
  { icon: Receipt, text: "Scan any receipt and detect items in seconds" },
  { icon: Users, text: "Split by item or evenly with friends and guests" },
  { icon: ShieldCheck, text: "Settle up via GCash or bank transfer, tracked automatically" },
];

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.5H42V20.4H24v7.2h11.3c-1.6 4.6-6 7.9-11.3 7.9-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.1-5.1C33.6 6.1 29 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l5.9 4.3C13.9 15.6 18.6 12 24 12c3 0 5.8 1.1 7.9 3l5.1-5.1C33.6 6.1 29 4 24 4c-7.4 0-13.8 4.2-17 10.3z" />
      <path fill="#4CAF50" d="M24 44c5 0 9.5-1.9 12.9-5.1l-5.9-5c-1.9 1.4-4.4 2.3-7 2.3-5.3 0-9.7-3.4-11.3-8l-5.9 4.5C9.9 39.6 16.4 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20.4H24v7.2h11.3c-.8 2.2-2.2 4.1-4.1 5.4l5.9 5C40.6 34.8 44 30 44 24c0-1.2-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 384 512" fill="currentColor">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

export default function RegisterPage() {
  const router = useRouter();

  const handleContinue = () => {
    router.push("/personalize");
  };

  return (
    <div className="flex flex-1 flex-col justify-between px-6 pb-10 pt-16">
      <div className="flex flex-col items-center gap-8">
        <SplitzelLogo size="md" />
        <div className="text-center">
          <h1 className="font-primary text-2xl font-extrabold tracking-brand text-navy dark:text-white">
            Start splitting effortlessly.
          </h1>
          <p className="mt-2 text-sm text-navy/60 dark:text-white/60 font-secondary">
            Scan receipts, split bills, and settle up with friends — built for Filipino student life.
          </p>
        </div>

        <div className="flex w-full flex-col gap-4">
          {features.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-skyblue/15 text-skyblue">
                <Icon size={18} />
              </span>
              <p className="text-sm text-navy/70 dark:text-white/70 font-secondary">{text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button variant="outline" fullWidth size="lg" icon={<GoogleIcon />} onClick={handleContinue}>
          Continue with Google
        </Button>
        <Button variant="primary" fullWidth size="lg" icon={<AppleIcon />} onClick={handleContinue}>
          Continue with Apple
        </Button>
        <p className="mt-2 text-center text-xs text-navy/40 dark:text-white/40 font-secondary">
          By continuing, you agree to Splitzel&apos;s Terms &amp; Privacy Policy.
        </p>
      </div>
    </div>
  );
}
