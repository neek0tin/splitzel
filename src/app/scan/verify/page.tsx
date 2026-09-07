"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/store/useAppStore";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function VerifyReceiptPage() {
  const router = useRouter();
  const receipt = useAppStore((s) => s.draft.receipt);

  useEffect(() => {
    if (!receipt) router.replace("/scan");
  }, [receipt, router]);

  if (!receipt) return null;

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader title="Verify Receipt" onBack={() => router.push("/scan")} />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <p className="mb-4 text-center text-xs text-navy/50 dark:text-white/50 font-secondary">
          We detected the following items. Double-check before splitting.
        </p>

        <div
          className="mx-auto w-full max-w-[300px] bg-[#fdfaf2] px-5 py-6 text-navy shadow-md"
          style={{ fontFamily: "var(--font-secondary)", clipPath: "polygon(0% 0%,100% 0%,100% 98%,97% 100%,94% 98%,91% 100%,88% 98%,85% 100%,82% 98%,79% 100%,76% 98%,73% 100%,70% 98%,67% 100%,64% 98%,61% 100%,58% 98%,55% 100%,52% 98%,49% 100%,46% 98%,43% 100%,40% 98%,37% 100%,34% 98%,31% 100%,28% 98%,25% 100%,22% 98%,19% 100%,16% 98%,13% 100%,10% 98%,7% 100%,4% 98%,0% 100%)" }}
        >
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-widest">{receipt.establishment}</p>
            <p className="mt-1 text-[11px] text-navy/60">{formatDate(receipt.date)}</p>
          </div>

          <div className="my-4 border-t border-dashed border-navy/30" />

          <div className="flex flex-col gap-2">
            {receipt.items.map((item) => (
              <div key={item.id} className="flex justify-between text-xs">
                <span className="pr-2">
                  {item.quantity > 1 ? `${item.quantity}x ` : ""}
                  {item.name}
                </span>
                <span className="whitespace-nowrap">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          <div className="my-4 border-t border-dashed border-navy/30" />

          <div className="flex flex-col gap-1.5 text-xs">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(receipt.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>VAT (12%)</span>
              <span>{formatCurrency(receipt.vat)}</span>
            </div>
            <div className="flex justify-between">
              <span>Service Charge (10%)</span>
              <span>{formatCurrency(receipt.serviceCharge)}</span>
            </div>
          </div>

          <div className="my-4 border-t border-dashed border-navy/30" />

          <div className="flex justify-between text-sm font-bold">
            <span>GRAND TOTAL</span>
            <span>{formatCurrency(receipt.total)}</span>
          </div>
        </div>
      </div>

      <div className="px-6 pb-8 pt-2">
        <Button fullWidth size="lg" onClick={() => router.push("/scan/method")}>
          Choose Split Method
        </Button>
      </div>
    </div>
  );
}
