"use client";

import { useState } from "react";
import { Check, Copy, Share2, UserPlus, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { MockQRCode } from "@/components/ui/MockQRCode";
import { RealQRCode } from "@/components/ui/RealQRCode";
import type { FriendCodeMatch } from "@/lib/supabase/queries";
import type { Friend } from "@/types";

export default function FriendsPage() {
  const user = useAppStore((s) => s.user);
  const friends = useAppStore((s) => s.friends);
  const findFriendByCode = useAppStore((s) => s.findFriendByCode);
  const connectFriend = useAppStore((s) => s.connectFriend);

  const [addOpen, setAddOpen] = useState(false);
  const [qrFriend, setQrFriend] = useState<Friend | null>(null);
  const [copied, setCopied] = useState(false);

  const [code, setCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [match, setMatch] = useState<FriendCodeMatch | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/add-friend/${user.friendCode}`;

  const resetAddModal = () => {
    setCode("");
    setMatch(null);
    setError(null);
  };

  const handleFind = async () => {
    if (!code.trim()) return;
    setSearching(true);
    setError(null);
    setMatch(null);
    try {
      const found = await findFriendByCode(code);
      if (!found) {
        setError("No one found with that code.");
      } else if (found.id === user.id) {
        setError("That's your own code.");
      } else if (friends.some((f) => f.id === found.id)) {
        setError(`You're already connected with ${found.name}.`);
      } else {
        setMatch(found);
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSearching(false);
    }
  };

  const handleConnect = async () => {
    if (!match) return;
    setConnecting(true);
    setError(null);
    try {
      await connectFriend(match.id);
      resetAddModal();
      setAddOpen(false);
    } catch {
      setError("Couldn't connect. Please try again.");
    } finally {
      setConnecting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(user.friendCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: "Add me on Splitzel", url: inviteUrl }).catch(() => {});
    } else {
      handleCopyCode();
    }
  };

  return (
    <div className="flex flex-col pb-8">
      <div className="px-6 pt-6">
        <div className="flex items-center justify-between">
          <h1 className="font-primary text-xl font-bold tracking-brand text-navy dark:text-white">Friends</h1>
          <Button size="sm" icon={<UserPlus size={16} />} onClick={() => setAddOpen(true)}>
            Add Friend
          </Button>
        </div>

        <Card outlined className="mt-5">
          <p className="text-xs font-bold uppercase tracking-wide text-navy/40 dark:text-white/40 font-secondary">
            Your Friend Code
          </p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="font-primary text-2xl font-extrabold tracking-brand text-navy dark:text-white">
              {user.friendCode}
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleCopyCode}
                className="flex h-9 w-9 items-center justify-center rounded-2xl border-2 border-navy/15 dark:border-white/20 text-navy dark:text-white active:scale-95 transition-transform"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
              <button
                onClick={handleShare}
                className="flex h-9 w-9 items-center justify-center rounded-2xl border-2 border-navy/15 dark:border-white/20 text-navy dark:text-white active:scale-95 transition-transform"
              >
                <Share2 size={16} />
              </button>
            </div>
          </div>
          <p className="mt-1 text-xs text-navy/50 dark:text-white/50 font-secondary">
            Share this code, or let a friend scan your QR below.
          </p>
        </Card>

        {friends.length === 0 && (
          <p className="mt-10 text-center text-sm text-navy/40 dark:text-white/40 font-secondary">
            No friends connected yet. Add one above to get started.
          </p>
        )}

        <div className="mt-5 flex flex-col gap-3">
          {friends.map((friend) => (
            <Card key={friend.id} outlined className="flex items-center gap-3">
              <Avatar name={friend.name} color={friend.avatarColor} size="md" />
              <div className="min-w-0 flex-1">
                <p className="font-primary text-sm font-bold tracking-brand text-navy dark:text-white truncate">
                  {friend.name}
                </p>
                <p className="text-xs text-navy/50 dark:text-white/50 font-secondary">
                  {friend.payment.gcashNumber ?? "No payment info yet"}
                </p>
              </div>
              <button
                onClick={() => setQrFriend(friend)}
                className="rounded-2xl border-2 border-navy/15 dark:border-white/20 px-3 py-2 text-xs font-semibold text-navy dark:text-white font-secondary active:scale-95 transition-transform"
              >
                Show QR
              </button>
            </Card>
          ))}
        </div>
      </div>

      <Modal
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          resetAddModal();
        }}
        title="Add Friend"
      >
        <div className="flex flex-col items-center gap-5 pb-2">
          <RealQRCode value={inviteUrl} size={160} />

          <div className="w-full">
            <label className="text-sm font-semibold text-navy/70 dark:text-white/70 font-secondary">
              Enter their friend code
            </label>
            <div className="mt-1.5 flex items-start gap-2">
              <div className="flex-1">
                <Input
                  placeholder="e.g. 7K4M9QX"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setMatch(null);
                    setError(null);
                  }}
                  className="uppercase"
                />
              </div>
              <Button onClick={handleFind} disabled={!code.trim() || searching}>
                {searching ? "..." : "Find"}
              </Button>
            </div>
          </div>

          {error && <p className="text-center text-sm text-orange font-secondary">{error}</p>}

          {match && (
            <Card outlined className="flex w-full items-center gap-3">
              <Avatar name={match.name} color={match.avatarColor} size="md" />
              <div className="min-w-0 flex-1">
                <p className="font-primary text-sm font-bold tracking-brand text-navy dark:text-white truncate">
                  {match.name}
                </p>
                <p className="text-xs text-navy/50 dark:text-white/50 font-secondary">Add as a friend?</p>
              </div>
              <button
                onClick={() => setMatch(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-navy/40 dark:text-white/40"
              >
                <X size={16} />
              </button>
            </Card>
          )}

          <Button fullWidth size="lg" disabled={!match || connecting} onClick={handleConnect}>
            {connecting ? "Connecting..." : "Add Friend"}
          </Button>
        </div>
      </Modal>

      <Modal open={!!qrFriend} onClose={() => setQrFriend(null)} title={qrFriend?.name}>
        {qrFriend && (
          <div className="flex flex-col items-center gap-4 pb-2">
            <Avatar name={qrFriend.name} color={qrFriend.avatarColor} size="lg" />
            {qrFriend.payment.hasQr ? (
              <MockQRCode seed={qrFriend.id} size={200} />
            ) : (
              <p className="text-xs text-navy/40 dark:text-white/40 font-secondary">No QR uploaded</p>
            )}
            <div className="w-full rounded-2xl bg-cream dark:bg-navy p-4 text-center">
              <p className="text-xs text-navy/50 dark:text-white/50 font-secondary">GCash Number</p>
              <p className="mt-1 font-primary text-lg font-bold text-navy dark:text-white">
                {qrFriend.payment.gcashNumber ?? "Not set"}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
