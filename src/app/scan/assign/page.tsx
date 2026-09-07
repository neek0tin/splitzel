"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, UserPlus } from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { useAppStore } from "@/store/useAppStore";
import { colorForName, formatCurrency, genId } from "@/lib/utils";

export default function AssignMembersPage() {
  const router = useRouter();
  const draft = useAppStore((s) => s.draft);
  const friends = useAppStore((s) => s.friends);
  const addDraftMember = useAppStore((s) => s.addDraftMember);
  const removeDraftMember = useAppStore((s) => s.removeDraftMember);
  const toggleItemAssignment = useAppStore((s) => s.toggleItemAssignment);
  const finalizeSplit = useAppStore((s) => s.finalizeSplit);

  const [friendsOpen, setFriendsOpen] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!draft.receipt || !draft.method) router.replace("/scan");
  }, [draft.receipt, draft.method, router]);

  const availableFriends = useMemo(
    () => friends.filter((f) => !draft.members.some((m) => m.id === f.id)),
    [friends, draft.members]
  );

  const evenShare = useMemo(() => {
    if (!draft.receipt || draft.members.length === 0) return 0;
    return draft.receipt.total / draft.members.length;
  }, [draft.receipt, draft.members.length]);

  if (!draft.receipt || !draft.method) return null;
  const receipt = draft.receipt;

  const handleAddGuest = () => {
    if (!guestName.trim()) return;
    addDraftMember({
      id: genId("guest"),
      name: `${guestName.trim()} (Guest)`,
      avatarColor: colorForName(guestName.trim()),
      isGuest: true,
      isCurrentUser: false,
      status: "pending",
    });
    setGuestName("");
    setGuestOpen(false);
  };

  const handleReview = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const id = await finalizeSplit();
      if (id) router.push(`/split/${id}`);
      else setSubmitting(false);
    } catch {
      setError("Couldn't create the split. Check your connection and try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader title="Add Members" onBack={() => router.push("/scan/method")} />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="flex flex-wrap items-center gap-3">
          {draft.members.map((m) => (
            <div key={m.id} className="flex flex-col items-center gap-1">
              <div className="relative">
                <Avatar name={m.name} color={m.avatarColor} size="md" />
                {!m.isCurrentUser && (
                  <button
                    onClick={() => removeDraftMember(m.id)}
                    className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange text-[10px] font-bold text-white"
                  >
                    &times;
                  </button>
                )}
              </div>
              <span className="max-w-[60px] truncate text-[10px] text-navy/60 dark:text-white/60 font-secondary">
                {m.isCurrentUser ? "You" : m.name}
              </span>
            </div>
          ))}

          <button
            onClick={() => setFriendsOpen(true)}
            className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed border-navy/25 dark:border-white/25 text-navy/50 dark:text-white/50"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setFriendsOpen(true)}
            className="rounded-2xl border-2 border-navy/15 dark:border-white/20 px-3 py-2 text-xs font-semibold text-navy dark:text-white font-secondary"
          >
            Add from Friends
          </button>
          <button
            onClick={() => setGuestOpen(true)}
            className="flex items-center gap-1 rounded-2xl border-2 border-navy/15 dark:border-white/20 px-3 py-2 text-xs font-semibold text-navy dark:text-white font-secondary"
          >
            <UserPlus size={14} />
            Add Guest
          </button>
        </div>

        {draft.method === "item" ? (
          <div className="mt-7">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-navy/40 dark:text-white/40 font-secondary">
              Who Ordered (Select All That Apply)
            </p>
            <div className="flex flex-col gap-3">
              {receipt.items.map((item) => {
                const assignment = draft.assignments.find((a) => a.itemId === item.id);
                return (
                  <Card key={item.id} outlined>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-navy dark:text-white font-secondary">
                        {item.quantity > 1 ? `${item.quantity}x ` : ""}
                        {item.name}
                      </span>
                      <span className="text-sm font-bold text-navy dark:text-white font-secondary">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {draft.members.map((m) => (
                        <Avatar
                          key={m.id}
                          name={m.name}
                          color={m.avatarColor}
                          size="sm"
                          selected={assignment?.memberIds.includes(m.id) ?? false}
                          onClick={() => toggleItemAssignment(item.id, m.id)}
                        />
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-7">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-navy/40 dark:text-white/40 font-secondary">
              Even Split Preview
            </p>
            <div className="flex flex-col gap-2">
              {draft.members.map((m) => (
                <Card key={m.id} outlined className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={m.name} color={m.avatarColor} size="sm" />
                    <span className="text-sm font-semibold text-navy dark:text-white font-secondary">
                      {m.isCurrentUser ? "You" : m.name}
                    </span>
                  </div>
                  <span className="font-primary text-sm font-bold text-navy dark:text-white">
                    {formatCurrency(evenShare)}
                  </span>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-6 pb-8 pt-2">
        <Button fullWidth size="lg" disabled={draft.members.length < 2 || submitting} onClick={handleReview}>
          {submitting ? "Creating Split..." : "Review Split"}
        </Button>
        {error && (
          <p className="mt-2 text-center text-xs text-orange font-secondary">{error}</p>
        )}
        {!error && draft.members.length < 2 && (
          <p className="mt-2 text-center text-xs text-navy/40 dark:text-white/40 font-secondary">
            Add at least one more person to continue.
          </p>
        )}
      </div>

      <Modal open={friendsOpen} onClose={() => setFriendsOpen(false)} title="Add from Friends">
        <div className="flex flex-col gap-2">
          {availableFriends.length === 0 && (
            <p className="py-6 text-center text-sm text-navy/40 dark:text-white/40 font-secondary">
              All friends have been added.
            </p>
          )}
          {availableFriends.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                addDraftMember({
                  id: f.id,
                  name: f.name,
                  avatarColor: f.avatarColor,
                  isGuest: false,
                  isCurrentUser: false,
                  status: "pending",
                });
              }}
              className="flex items-center gap-3 rounded-2xl px-2 py-2.5 active:bg-navy/5 dark:active:bg-white/5"
            >
              <Avatar name={f.name} color={f.avatarColor} size="sm" />
              <span className="text-sm font-semibold text-navy dark:text-white font-secondary">{f.name}</span>
            </button>
          ))}
        </div>
      </Modal>

      <Modal open={guestOpen} onClose={() => setGuestOpen(false)} title="Add Guest">
        <div className="flex flex-col gap-4">
          <Input label="Guest Name" placeholder="e.g. Kevin" value={guestName} onChange={(e) => setGuestName(e.target.value)} autoFocus />
          <Button fullWidth size="lg" disabled={!guestName.trim()} onClick={handleAddGuest}>
            Add Guest
          </Button>
        </div>
      </Modal>
    </div>
  );
}
