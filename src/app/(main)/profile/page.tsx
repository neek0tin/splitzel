"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, LogOut, Moon, Shield, Smartphone, Trash2, Upload, Wallet } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { Avatar } from "@/components/ui/Avatar";
import { Card } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Switch";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { gcashQrUrl, removeGcashQr, uploadGcashQr } from "@/lib/gcashQr";

export default function ProfilePage() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const updateUserPayment = useAppStore((s) => s.updateUserPayment);
  const darkMode = useAppStore((s) => s.darkMode);
  const toggleDarkMode = useAppStore((s) => s.toggleDarkMode);
  const logOut = useAppStore((s) => s.logOut);

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [gcashNumber, setGcashNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountName, setBankAccountName] = useState("");
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const qrInputRef = useRef<HTMLInputElement>(null);
  const [qrBusy, setQrBusy] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  if (!user) return null;
  const fullName = `${user.firstName} ${user.lastName}`.trim() || "Splitzel User";
  const qrImageUrl = gcashQrUrl(user.payment.gcashQrPath);

  const openPaymentModal = () => {
    setGcashNumber(user.payment.gcashNumber ?? "");
    setBankName(user.payment.bankName ?? "");
    setBankAccountNumber(user.payment.bankAccountNumber ?? "");
    setBankAccountName(user.payment.bankAccountName ?? "");
    setQrError(null);
    setPaymentOpen(true);
  };

  const handleSavePayment = async () => {
    setSaving(true);
    try {
      await updateUserPayment({ gcashNumber, bankName, bankAccountNumber, bankAccountName });
      setPaymentOpen(false);
    } finally {
      setSaving(false);
    }
  };

  // The QR saves immediately rather than waiting for the Save button: the file
  // is already in storage by the time we know its path, so leaving the profile
  // column unwritten would orphan the object if the modal were dismissed.
  const handleQrSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setQrBusy(true);
    setQrError(null);
    const previousPath = user.payment.gcashQrPath;
    try {
      const path = await uploadGcashQr(user.id, file);
      await updateUserPayment({ gcashQrPath: path });
      await removeGcashQr(previousPath);
    } catch (err) {
      setQrError(err instanceof Error ? err.message : "Couldn't upload that QR. Please try again.");
    } finally {
      setQrBusy(false);
    }
  };

  const handleQrRemove = async () => {
    const path = user.payment.gcashQrPath;
    if (!path) return;

    setQrBusy(true);
    setQrError(null);
    try {
      await updateUserPayment({ gcashQrPath: null });
      await removeGcashQr(path);
    } catch (err) {
      setQrError(err instanceof Error ? err.message : "Couldn't remove that QR. Please try again.");
    } finally {
      setQrBusy(false);
    }
  };

  const handleLogOut = async () => {
    setLoggingOut(true);
    try {
      await logOut();
      router.push("/register");
    } catch {
      setLoggingOut(false);
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

        <button
          onClick={handleLogOut}
          disabled={loggingOut}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-orange/40 py-3 text-sm font-semibold text-orange font-secondary active:scale-95 transition-transform disabled:opacity-50"
        >
          <LogOut size={16} />
          {loggingOut ? "Logging Out..." : "Log Out"}
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
          <div className="flex flex-col gap-3 rounded-2xl border-2 border-navy/10 dark:border-white/10 p-4">
            <div>
              <p className="text-sm font-semibold text-navy dark:text-white font-secondary">GCash QR</p>
              <p className="mt-0.5 text-xs text-navy/50 dark:text-white/50 font-secondary">
                Screenshot your QR in the GCash app, then upload it here. Friends scan it to pay you.
              </p>
            </div>

            {qrImageUrl ? (
              <div className="flex flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrImageUrl}
                  alt="Your GCash QR code"
                  width={160}
                  height={160}
                  className="h-40 w-40 rounded-xl bg-white object-contain"
                />
                <div className="flex w-full gap-2">
                  <Button variant="outline" fullWidth disabled={qrBusy} onClick={() => qrInputRef.current?.click()}>
                    <span className="flex items-center justify-center gap-1.5">
                      <Upload size={14} />
                      Replace
                    </span>
                  </Button>
                  <Button variant="danger" fullWidth disabled={qrBusy} onClick={handleQrRemove}>
                    <span className="flex items-center justify-center gap-1.5">
                      <Trash2 size={14} />
                      Remove
                    </span>
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => qrInputRef.current?.click()}
                disabled={qrBusy}
                className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-navy/20 dark:border-white/20 text-navy/50 dark:text-white/50 active:scale-[0.99] transition-transform disabled:opacity-50"
              >
                <Upload size={20} />
                <span className="text-xs font-semibold font-secondary">
                  {qrBusy ? "Uploading..." : "Upload your GCash QR"}
                </span>
              </button>
            )}

            <input
              ref={qrInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleQrSelected}
            />

            {qrError && <p className="text-xs text-orange font-secondary">{qrError}</p>}
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
