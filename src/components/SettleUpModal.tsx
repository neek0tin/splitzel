"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { MockQRCode } from "@/components/ui/MockQRCode";
import { cn, formatCurrency } from "@/lib/utils";
import { getOverdueDays, getPayableShare } from "@/lib/aggregates";
import type { Friend, Split } from "@/types";

type PayMethod = "gcash" | "bank";

export function SettleUpModal({
  open,
  onClose,
  split,
  memberId,
  payee,
  onSettled,
}: {
  open: boolean;
  onClose: () => void;
  split: Split;
  memberId: string;
  payee: Friend | null;
  onSettled: () => void;
}) {
  const [method, setMethod] = useState<PayMethod>("gcash");
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const share = getPayableShare(split, memberId);
  const overdueDays = getOverdueDays(split);

  const handleCopy = (value: string) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopied(value);
    setTimeout(() => setCopied(null), 1500);
  };

  const handleConfirm = () => {
    setConfirmed(true);
    setTimeout(() => {
      onSettled();
      setConfirmed(false);
      onClose();
    }, 900);
  };

  if (!payee) return null;

  return (
    <Modal open={open} onClose={onClose} title="Settle Up">
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <Avatar name={payee.name} color={payee.avatarColor} size="md" />
          <div>
            <p className="text-xs text-navy/50 dark:text-white/50 font-secondary">Paying</p>
            <p className="font-primary text-base font-bold tracking-brand text-navy dark:text-white">{payee.name}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setMethod("gcash")}
            className={cn(
              "flex-1 rounded-2xl border-2 py-2.5 text-sm font-semibold font-secondary transition-colors",
              method === "gcash"
                ? "bg-skyblue border-skyblue text-navy"
                : "border-navy/15 text-navy/50 dark:border-white/15 dark:text-white/50"
            )}
          >
            GCash
          </button>
          <button
            onClick={() => setMethod("bank")}
            className={cn(
              "flex-1 rounded-2xl border-2 py-2.5 text-sm font-semibold font-secondary transition-colors",
              method === "bank"
                ? "bg-skyblue border-skyblue text-navy"
                : "border-navy/15 text-navy/50 dark:border-white/15 dark:text-white/50"
            )}
          >
            Bank Transfer
          </button>
        </div>

        {method === "gcash" ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl bg-cream dark:bg-navy p-4">
            {payee.payment.hasQr ? (
              <MockQRCode seed={payee.id} size={160} />
            ) : (
              <p className="text-xs text-navy/40 dark:text-white/40 font-secondary">No QR uploaded</p>
            )}
            <CopyRow label="GCash Number" value={payee.payment.gcashNumber ?? "—"} onCopy={handleCopy} copied={copied} />
            <CopyRow label="Account Name" value={payee.payment.gcashName ?? payee.name} onCopy={handleCopy} copied={copied} />
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-2xl bg-cream dark:bg-navy p-4">
            {payee.payment.bankName ? (
              <>
                <CopyRow label="Bank" value={payee.payment.bankName} onCopy={handleCopy} copied={copied} />
                <CopyRow
                  label="Account Number"
                  value={payee.payment.bankAccountNumber ?? "—"}
                  onCopy={handleCopy}
                  copied={copied}
                />
                <CopyRow
                  label="Account Name"
                  value={payee.payment.bankAccountName ?? payee.name}
                  onCopy={handleCopy}
                  copied={copied}
                />
              </>
            ) : (
              <p className="text-center text-xs text-navy/40 dark:text-white/40 font-secondary">
                No bank details on file for {payee.name}.
              </p>
            )}
          </div>
        )}

        <div className="rounded-2xl border-2 border-navy/10 dark:border-white/10 p-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-navy/40 dark:text-white/40 font-secondary">
            Fee Breakdown
          </p>
          <div className="flex flex-col gap-1.5 text-sm font-secondary">
            <Row label="Item Share" value={share.subtotal} />
            <Row label="Tax / Service Charge" value={share.taxServiceCharge} />
            {overdueDays > 0 && (
              <Row label={`Late Penalty (${overdueDays} day${overdueDays > 1 ? "s" : ""})`} value={share.lateFee} accent />
            )}
            <Row label="Splitzel Convenience Fee" value={share.convenienceFee} />
            <div className="my-1.5 h-px bg-navy/10 dark:bg-white/10" />
            <div className="flex justify-between font-primary text-base font-bold text-navy dark:text-white">
              <span>Total Payable</span>
              <span>{formatCurrency(share.total)}</span>
            </div>
          </div>
        </div>

        <Button fullWidth size="lg" onClick={handleConfirm} disabled={confirmed}>
          {confirmed ? (
            <span className="flex items-center gap-2">
              <Check size={18} /> Marked as Paid
            </span>
          ) : (
            `Mark as Paid — ${formatCurrency(share.total)}`
          )}
        </Button>
      </div>
    </Modal>
  );
}

function Row({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-navy/60 dark:text-white/60">{label}</span>
      <span className={cn("font-semibold", accent ? "text-orange" : "text-navy dark:text-white")}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function CopyRow({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  onCopy: (v: string) => void;
  copied: string | null;
}) {
  return (
    <div className="flex w-full items-center justify-between gap-2">
      <div>
        <p className="text-[11px] text-navy/50 dark:text-white/50 font-secondary">{label}</p>
        <p className="text-sm font-bold text-navy dark:text-white font-secondary">{value}</p>
      </div>
      <button
        onClick={() => onCopy(value)}
        className="flex items-center gap-1 rounded-2xl border-2 border-navy/15 dark:border-white/20 px-2.5 py-1.5 text-xs font-semibold text-navy dark:text-white"
      >
        {copied === value ? <Check size={13} /> : <Copy size={13} />}
        {copied === value ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
