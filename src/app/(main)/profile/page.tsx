"use client";

import { useState } from "react";
import { ChevronRight, LogOut, Moon, Shield, Smartphone, Wallet } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Switch";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ProfilePage() {
  const user = useAppStore((s) => s.user);
  const updateUserPayment = useAppStore((s) => s.updateUserPayment);
  const darkMode = useAppStore((s) => s.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [gcashNumber, setGcashNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [hasQr, setHasQr] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!user) return null;
  const fullName = `${user.firstName} ${user.lastName}`.trim() || "Splitzel User";

  const openPaymentModal = () => {
    setGcashNumber(user.payment.gcashNumber ?? "");
    setBankName(user.payment.bankName ?? "");
    setBankAccountNumber(user.payment.bankAccountNumber ?? "");
    setBankAccountName(user.payment.bankAccountName ?? "");
    setHasQr(user.payment.hasQr ?? false);
    setPaymentOpen(true);
  };

  const handleSavePayment = async () => {
    setSaving(true);
    try {
      await updateUserPayment({ gcashNumber, bankName, bankAccountNumber, bankAccountName, hasQr });
      setPaymentOpen(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col pb-8">
      <div className="px-6 pt-6">
        <h1 className="font-primary text-xl font-bold tracking-brand text-navy dark:text-white">Profile</h1>

        <div className="mt-5 flex items-center gap-4">
          <Avatar name={fullName} color={user.avatarColor} size="lg" />
          <div>
            <p className="font-primary text-lg font-bold tracking-brand text-navy dark:text-white">{fullName}</p>
            <p className="text-sm text-navy/50 dark:text-white/50 font-secondary">Splitzel Member</p>
          </div>
        </div>

        <div className="mt-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-navy/40 dark:text-white/40 font-secondary">
            Payment Info
          </p>
          <Card outlined className="p-0 overflow-hidden">
            <RowButton
              icon={<Wallet size={18} />}
              label="Payment Info"
              value={user.payment.gcashNumber || "Not set"}
              onClick={openPaymentModal}
            />
          </Card>
        </div>

        <div className="mt-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-navy/40 dark:text-white/40 font-secondary">
            Preferences
          </p>
          <Card outlined className="p-0 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-cream dark:bg-navy text-navy dark:text-white">
                  <Moon size={16} />
                </span>
                <span className="text-sm font-semibold text-navy dark:text-white font-secondary">Dark Mode</span>
              </div>
              <Switch checked={darkMode} onChange={toggleDarkMode} />
            </div>
            <Divider />
            <RowButton icon={<Shield size={18} />} label="Privacy & Security" onClick={() => {}} />
            <Divider />
            <RowButton icon={<Smartphone size={18} />} label="Linked Devices" onClick={() => {}} />
          </Card>
        </div>

        <button className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-orange/40 py-3 text-sm font-semibold text-orange font-secondary active:scale-95 transition-transform">
          <LogOut size={16} />
          Log Out
        </button>
      </div>

      <Modal open={paymentOpen} onClose={() => setPaymentOpen(false)} title="Payment Info">
        <div className="flex flex-col gap-4">
          <p className="-mt-1 text-xs text-navy/50 dark:text-white/50 font-secondary">
            Connected friends see this when they settle up with you.
          </p>
          <Input
            label="GCash Number"
            value={gcashNumber}
            onChange={(e) => setGcashNumber(e.target.value)}
            placeholder="0917 123 4567"
          />
          <Input
            label="Bank Name (optional)"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            placeholder="BPI"
          />
          <Input
            label="Bank Account Number (optional)"
            value={bankAccountNumber}
            onChange={(e) => setBankAccountNumber(e.target.value)}
            placeholder="1234 5678 90"
          />
          <Input
            label="Bank Account Name (optional)"
            value={bankAccountName}
            onChange={(e) => setBankAccountName(e.target.value)}
            placeholder={fullName}
          />
          <div className="flex items-center justify-between rounded-2xl border-2 border-navy/10 dark:border-white/10 px-4 py-3">
            <span className="text-sm font-semibold text-navy dark:text-white font-secondary">I have a GCash QR</span>
            <Switch checked={hasQr} onChange={() => setHasQr((v) => !v)} />
          </div>
          <Button fullWidth size="lg" disabled={saving} onClick={handleSavePayment}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-navy/5 dark:bg-white/10" />;
}

function RowButton({
  icon,
  label,
  value,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between px-4 py-4 active:bg-navy/5 dark:active:bg-white/5">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-cream dark:bg-navy text-navy dark:text-white">
          {icon}
        </span>
        <span className="text-sm font-semibold text-navy dark:text-white font-secondary">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-sm text-navy/50 dark:text-white/50 font-secondary">{value}</span>}
        <ChevronRight size={16} className="text-navy/30 dark:text-white/30" />
      </div>
    </button>
  );
}
