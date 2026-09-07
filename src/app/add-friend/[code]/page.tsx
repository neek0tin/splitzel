"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PretzelIcon } from "@/components/ui/Logo";
import { useAppStore } from "@/store/useAppStore";
import type { FriendCodeMatch } from "@/lib/supabase/queries";

export default function AddFriendByLinkPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const router = useRouter();

  const initialized = useAppStore((s) => s.initialized);
  const hydrate = useAppStore((s) => s.hydrate);
  const user = useAppStore((s) => s.user);
  const findFriendByCode = useAppStore((s) => s.findFriendByCode);
  const connectFriend = useAppStore((s) => s.connectFriend);
  const friends = useAppStore((s) => s.friends);

  const [match, setMatch] = useState<FriendCodeMatch | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "connecting" | "done" | "error">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!initialized || !user?.firstName) return;

    findFriendByCode(code)
      .then((found) => {
        if (!found) {
          setError("This invite link isn't valid.");
        } else if (found.id === user.id) {
          setError("That's your own invite link.");
        } else if (friends.some((f) => f.id === found.id)) {
          setError(`You're already connected with ${found.name}.`);
        } else {
          setMatch(found);
        }
        setStatus("ready");
      })
      .catch(() => {
        setError("Something went wrong loading this invite.");
        setStatus("ready");
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized, user?.firstName, code]);

  const handleConnect = async () => {
    if (!match) return;
    setStatus("connecting");
    try {
      await connectFriend(match.id);
      setStatus("done");
    } catch {
      setError("Couldn't connect. Please try again.");
      setStatus("ready");
    }
  };

  if (!initialized) {
    return (
      <div className="flex flex-1 flex-col">
        <ScreenHeader title="Add Friend" onBack={() => router.push("/")} />
        <div className="flex flex-1 items-center justify-center">
          <PretzelIcon size={40} className="animate-pulse" />
        </div>
      </div>
    );
  }

  if (!user?.firstName) {
    return (
      <div className="flex flex-1 flex-col">
        <ScreenHeader title="Add Friend" onBack={() => router.push("/")} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <PretzelIcon size={40} />
          <p className="text-sm text-navy/60 dark:text-white/60 font-secondary">
            Sign in to Splitzel first, then open this invite link again to connect.
          </p>
          <Button onClick={() => router.push("/register")}>Sign In</Button>
        </div>
      </div>
    );
  }

  if (status === "loading") {
    return (
      <div className="flex flex-1 flex-col">
        <ScreenHeader title="Add Friend" onBack={() => router.push("/friends")} />
        <div className="flex flex-1 items-center justify-center">
          <PretzelIcon size={40} className="animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader title="Add Friend" onBack={() => router.push("/friends")} />
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-8 text-center">
        {status === "done" ? (
          <>
            <PretzelIcon size={40} />
            <p className="font-primary text-lg font-bold text-navy dark:text-white">
              You&apos;re now connected with {match?.name}!
            </p>
            <Button onClick={() => router.push("/friends")}>Go to Friends</Button>
          </>
        ) : error ? (
          <>
            <p className="text-sm text-orange font-secondary">{error}</p>
            <Button variant="outline" onClick={() => router.push("/friends")}>
              Go to Friends
            </Button>
          </>
        ) : match ? (
          <>
            <Avatar name={match.name} color={match.avatarColor} size="lg" />
            <Card outlined className="w-full">
              <p className="font-primary text-lg font-bold text-navy dark:text-white">
                Add {match.name} as a friend?
              </p>
            </Card>
            <Button fullWidth size="lg" disabled={status === "connecting"} onClick={handleConnect}>
              {status === "connecting" ? "Connecting..." : "Add Friend"}
            </Button>
          </>
        ) : (
          <PretzelIcon size={40} className="animate-pulse" />
        )}
      </div>
    </div>
  );
}
