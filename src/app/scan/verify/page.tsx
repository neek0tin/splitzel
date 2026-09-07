"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/store/useAppStore";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { ReceiptItem } from "@/types";

export default function VerifyReceiptPage() {
  const router = useRouter();
  const receipt = useAppStore((s) => s.draft.receipt);
  const setDraftEstablishment = useAppStore((s) => s.setDraftEstablishment);
  const addDraftItem = useAppStore((s) => s.addDraftItem);
  const updateDraftItem = useAppStore((s) => s.updateDraftItem);
  const removeDraftItem = useAppStore((s) => s.removeDraftItem);

  const [nameOpen, setNameOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  const [itemModal, setItemModal] = useState<{ item: ReceiptItem | null } | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemQty, setItemQty] = useState("1");

  useEffect(() => {
    if (!receipt) router.replace("/scan");
  }, [receipt, router]);

  if (!receipt) return null;

  const openEditName = () => {
    setNameDraft(receipt.establishment);
    setNameOpen(true);
  };

  const saveEditName = () => {
    setDraftEstablishment(nameDraft.trim() || "Receipt");
    setNameOpen(false);
  };

  const openAddItem = () => {
    setItemName("");
    setItemPrice("");
    setItemQty("1");
    setItemModal({ item: null });
  };

  const openEditItem = (item: ReceiptItem) => {
    setItemName(item.name);
    setItemPrice(String(item.price));
    setItemQty(String(item.quantity));
    setItemModal({ item });
  };

  const saveItem = () => {
    const price = parseFloat(itemPrice);
    const quantity = Math.max(1, Math.round(parseFloat(itemQty) || 1));
    if (!itemName.trim() || !Number.isFinite(price) || price <= 0) return;

    if (itemModal?.item) {
      updateDraftItem(itemModal.item.id, { name: itemName.trim(), price, quantity });
    } else {
      addDraftItem({ name: itemName.trim(), price, quantity });
    }
    setItemModal(null);
  };

  const deleteItem = () => {
    if (itemModal?.item) removeDraftItem(itemModal.item.id);
    setItemModal(null);
  };

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader title="Verify Receipt" onBack={() => router.push("/scan")} />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <p className="mb-4 text-center text-xs text-navy/50 dark:text-white/50 font-secondary">
          Tap anything to fix it before splitting.
        </p>

        <div
          className="mx-auto w-full max-w-[300px] bg-[#fdfaf2] px-5 py-6 text-navy shadow-md"
          style={{ fontFamily: "var(--font-secondary)", clipPath: "polygon(0% 0%,100% 0%,100% 98%,97% 100%,94% 98%,91% 100%,88% 98%,85% 100%,82% 98%,79% 100%,76% 98%,73% 100%,70% 98%,67% 100%,64% 98%,61% 100%,58% 98%,55% 100%,52% 98%,49% 100%,46% 98%,43% 100%,40% 98%,37% 100%,34% 98%,31% 100%,28% 98%,25% 100%,22% 98%,19% 100%,16% 98%,13% 100%,10% 98%,7% 100%,4% 98%,0% 100%)" }}
        >
          <button onClick={openEditName} className="flex w-full flex-col items-center gap-1 text-center">
            <span className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-widest">
              {receipt.establishment || "Tap to name this receipt"}
              <Pencil size={11} className="text-navy/40" />
            </span>
            <span className="text-[11px] text-navy/60">{formatDate(receipt.date)}</span>
          </button>

          <div className="my-4 border-t border-dashed border-navy/30" />

          <div className="flex flex-col gap-1">
            {receipt.items.length === 0 && (
              <p className="py-2 text-center text-xs text-navy/40">No items yet — add one below.</p>
            )}
            {receipt.items.map((item) => (
              <button
                key={item.id}
                onClick={() => openEditItem(item)}
                className="flex justify-between gap-2 rounded-lg px-1 py-1 text-left text-xs active:bg-navy/5"
              >
                <span className="pr-2">
                  {item.quantity > 1 ? `${item.quantity}x ` : ""}
                  {item.name}
                </span>
                <span className="whitespace-nowrap">{formatCurrency(item.price * item.quantity)}</span>
              </button>
            ))}
            <button
              onClick={openAddItem}
              className="mt-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-skyblue active:bg-navy/5"
            >
              <Plus size={13} />
              Add Item
            </button>
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
        <Button fullWidth size="lg" disabled={receipt.items.length === 0} onClick={() => router.push("/scan/method")}>
          Choose Split Method
        </Button>
        {receipt.items.length === 0 && (
          <p className="mt-2 text-center text-xs text-navy/40 dark:text-white/40 font-secondary">
            Add at least one item to continue.
          </p>
        )}
      </div>

      <Modal open={nameOpen} onClose={() => setNameOpen(false)} title="Establishment">
        <div className="flex flex-col gap-4">
          <Input
            label="Name"
            placeholder="e.g. Mang Inasal"
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            autoFocus
          />
          <Button fullWidth size="lg" onClick={saveEditName}>
            Save
          </Button>
        </div>
      </Modal>

      <Modal open={!!itemModal} onClose={() => setItemModal(null)} title={itemModal?.item ? "Edit Item" : "Add Item"}>
        <div className="flex flex-col gap-4">
          <Input label="Item Name" placeholder="e.g. Chicken Inasal" value={itemName} onChange={(e) => setItemName(e.target.value)} autoFocus />
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                label="Unit Price"
                type="number"
                inputMode="decimal"
                placeholder="0.00"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
              />
            </div>
            <div className="w-24">
              <Input
                label="Qty"
                type="number"
                inputMode="numeric"
                min={1}
                value={itemQty}
                onChange={(e) => setItemQty(e.target.value)}
              />
            </div>
          </div>
          <Button fullWidth size="lg" disabled={!itemName.trim() || !itemPrice} onClick={saveItem}>
            {itemModal?.item ? "Save Changes" : "Add Item"}
          </Button>
          {itemModal?.item && (
            <button
              onClick={deleteItem}
              className="flex items-center justify-center gap-1.5 text-sm font-semibold text-orange font-secondary"
            >
              <Trash2 size={14} />
              Remove Item
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
}
