"use client";

import { useState } from "react";
import { Plus, Upload } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { MockQRCode } from "@/components/ui/MockQRCode";
import type { Friend } from "@/types";

export default function FriendsPage() {
  const friends = useAppStore((s) => s.friends);
  const addFriend = useAppStore((s) => s.addFriend);

  const [addOpen, setAddOpen] = useState(false);
  const [qrFriend, setQrFriend] = useState<Friend | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [gcashNumber, setGcashNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [qrUploaded, setQrUploaded] = useState(false);

  const resetForm = () => {
    setName("");
    setPhone("");
    setGcashNumber("");
    setBankName("");
    setBankAccountNumber("");
    setQrUploaded(false);
  };

  const canSave = name.trim().length > 0 && phone.trim().length > 0;

  const handleSave = () => {
    if (!canSave) return;
    addFriend({
      name: name.trim(),
      phone: phone.trim(),
      avatarColor: "#5AAFED",
      payment: {
        gcashNumber: gcashNumber.trim() || undefined,
        gcashName: name.trim(),
        bankName: bankName.trim() || undefined,
        bankAccountNumber: bankAccountNumber.trim() || undefined,
        bankAccountName: bankName.trim() ? name.trim() : undefined,
        hasQr: qrUploaded,
      },
    });
    resetForm();
    setAddOpen(false);
  };

  return (
    <div className="flex flex-col pb-8">
      <div className="px-6 pt-6">
        <div className="flex items-center justify-between">
          <h1 className="font-primary text-xl font-bold tracking-brand text-navy dark:text-white">Friends</h1>
          <Button size="sm" icon={<Plus size={16} />} onClick={() => setAddOpen(true)}>
            Add Friend
          </Button>
        </div>

        <div className="mt-5 flex flex-col gap-3">
          {friends.map((friend) => (
            <Card key={friend.id} outlined className="flex items-center gap-3">
              <Avatar name={friend.name} color={friend.avatarColor} size="md" />
              <div className="min-w-0 flex-1">
                <p className="font-primary text-sm font-bold tracking-brand text-navy dark:text-white truncate">
                  {friend.name}
                </p>
                <p className="text-xs text-navy/50 dark:text-white/50 font-secondary">{friend.phone}</p>
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

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add Friend">
        <div className="flex flex-col gap-4">
          <Input label="Name" placeholder="Juan Dela Cruz" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            label="Phone / GCash Number"
            placeholder="0917 123 4567"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              setGcashNumber(e.target.value);
            }}
          />
          <Input label="Bank Name (optional)" placeholder="BPI" value={bankName} onChange={(e) => setBankName(e.target.value)} />
          <Input
            label="Account Number (optional)"
            placeholder="1234 5678 90"
            value={bankAccountNumber}
            onChange={(e) => setBankAccountNumber(e.target.value)}
          />

          <div>
            <label className="text-sm font-semibold text-navy/70 dark:text-white/70 font-secondary">
              QR Image (optional)
            </label>
            <button
              onClick={() => setQrUploaded(true)}
              className="mt-1.5 flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-navy/20 dark:border-white/20 py-6 text-navy/50 dark:text-white/50"
            >
              <Upload size={20} />
              <span className="text-xs font-secondary">{qrUploaded ? "QR image uploaded ✓" : "Tap to upload QR"}</span>
            </button>
          </div>

          <Button fullWidth size="lg" disabled={!canSave} onClick={handleSave}>
            Save Friend
          </Button>
        </div>
      </Modal>

      <Modal open={!!qrFriend} onClose={() => setQrFriend(null)} title={qrFriend?.name}>
        {qrFriend && (
          <div className="flex flex-col items-center gap-4 pb-2">
            <Avatar name={qrFriend.name} color={qrFriend.avatarColor} size="lg" />
            <MockQRCode seed={qrFriend.id} size={200} />
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
