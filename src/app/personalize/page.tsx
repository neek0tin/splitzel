"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PretzelIcon } from "@/components/ui/Logo";
import { useAppStore } from "@/store/useAppStore";

export default function PersonalizePage() {
  const router = useRouter();
  const setUserName = useAppStore((s) => s.setUserName);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const canContinue = firstName.trim().length > 0 && lastName.trim().length > 0;

  const handleContinue = () => {
    if (!canContinue) return;
    setUserName(firstName.trim(), lastName.trim());
    completeOnboarding();
    router.push("/home");
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

      <Button variant="primary" size="lg" fullWidth disabled={!canContinue} onClick={handleContinue}>
        Continue
      </Button>
    </div>
  );
}
