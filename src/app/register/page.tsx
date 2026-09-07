"use client";

import { useState } from "react";
import { Receipt, ShieldCheck, Users } from "lucide-react";
import { SplitzelLogo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { signInWithProvider } from "@/lib/supabase/queries";

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

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path
        fill="#1877F2"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );
}

export default function RegisterPage() {
  const [connecting, setConnecting] = useState<"google" | "facebook" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (provider: "google" | "facebook") => {
    setConnecting(provider);
    setError(null);
    try {
      await signInWithProvider(provider, `${window.location.origin}/auth/callback`);
    } catch {
      setError(`Couldn't connect to ${provider === "google" ? "Google" : "Facebook"}. Please try again.`);
      setConnecting(null);
    }
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
        {error && <p className="text-center text-sm text-orange font-secondary">{error}</p>}
        <Button
          variant="outline"
          fullWidth
          size="lg"
          icon={<GoogleIcon />}
          onClick={() => handleSignIn("google")}
          disabled={connecting !== null}
        >
          {connecting === "google" ? "Connecting..." : "Continue with Google"}
        </Button>
        <Button
          variant="primary"
          fullWidth
          size="lg"
          icon={<FacebookIcon />}
          onClick={() => handleSignIn("facebook")}
          disabled={connecting !== null}
        >
          {connecting === "facebook" ? "Connecting..." : "Continue with Facebook"}
        </Button>
        <p className="mt-2 text-center text-xs text-navy/40 dark:text-white/40 font-secondary">
          By continuing, you agree to Splitzel&apos;s Terms &amp; Privacy Policy.
        </p>
      </div>
    </div>
  );
}
