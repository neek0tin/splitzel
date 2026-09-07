"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PretzelIcon } from "@/components/ui/Logo";
import { useAppStore } from "@/store/useAppStore";
import { fetchNameHint } from "@/lib/supabase/queries";

export default function PersonalizePage() {
  const router = useRouter();
  const setUserName = useAppStore((s) => s.setUserName);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If they just signed in with a real provider (e.g. Google), it already
  // knows their name — no need to make them type it again.
  useEffect(() => {
    fetchNameHint().then((hint) => {
      if (!hint) return;
      setFirstName((prev) => prev || hint.firstName);
      setLastName((prev) => prev || hint.lastName);
    });
  }, []);

  const canContinue = firstName.trim().length > 0 && lastName.trim().length > 0 && !submitting;

  const handleContinue = async () => {
    if (!canContinue) return;
    setSubmitting(true);
    setError(null);
    try {
      await setUserName(firstName.trim(), lastName.trim());
      router.push("/home");
    } catch {
      setError("Couldn't save your name. Check your connection and try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col justify-between px-6 pb-10 pt-16">
      <div>
        <PretzelIcon size={44} />
        <h1 className="mt-6 font-primary text-2xl font-extrabold tracking-brand text-navy dark:text-white">
          Welcome! Before splitting, name yourself.
        </h1>
        <p className="mt-2 text-sm text-navy/60 dark:text-white/60 font-secondary">
          This is how your friends will see you in every split.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          <Input
            id="firstName"
            label="First Name"
            placeholder="Juan"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoFocus
          />
          <Input
            id="lastName"
            label="Last Name"
            placeholder="Dela Cruz"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
      </div>

      <div>
        {error && <p className="mb-3 text-center text-sm text-orange font-secondary">{error}</p>}
        <Button variant="primary" size="lg" fullWidth disabled={!canContinue} onClick={handleContinue}>
          {submitting ? "Saving..." : "Continue"}
        </Button>
      </div>
    </div>
  );
}
