"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ScreenHeader } from "@/components/ScreenHeader";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Switch } from "@/components/ui/Switch";
import { PretzelIcon } from "@/components/ui/Logo";
import { useAppStore } from "@/store/useAppStore";
import { computeReceiptTotals } from "@/lib/splitEngine";
import { formatCurrency, genId } from "@/lib/utils";
import type { ItemAssignment, ReceiptItem } from "@/types";

export default function EditSplitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const initialized = useAppStore((s) => s.initialized);
  const hydrate = useAppStore((s) => s.hydrate);
  const user = useAppStore((s) => s.user);
  const splits = useAppStore((s) => s.splits);
  const editSplitReceipt = useAppStore((s) => s.editSplitReceipt);

  const split = splits.find((s) => s.id === id);
  const seededRef = useRef(false);

  const [establishment, setEstablishment] = useState("");
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [vatRate, setVatRate] = useState(0);
  const [serviceChargeRate, setServiceChargeRate] = useState(0);
  const [assignments, setAssignments] = useState<ItemAssignment[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [nameOpen, setNameOpen] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [itemModal, setItemModal] = useState<{ item: ReceiptItem | null } | null>(null);
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");
  const [itemQty, setItemQty] = useState("1");
  const [rateModal, setRateModal] = useState<"vat" | "serviceCharge" | null>(null);
  const [rateDraft, setRateDraft] = useState("");

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!split || seededRef.current) return;
    seededRef.current = true;
    setEstablishment(split.receipt.establishment);
    setItems(split.receipt.items);
    setVatRate(split.receipt.vatRate);
    setServiceChargeRate(split.receipt.serviceChargeRate);
    setAssignments(split.assignments);
  }, [split]);

  useEffect(() => {
    if (!initialized || !split || !user) return;
    // Only the owner, and only on Premium -- matches the entry point's gating.
    if (user.id !== split.ownerId || !user.isPremium) router.replace(`/split/${id}`);
  }, [initialized, split, user, id, router]);

  if (!initialized || !split) {
    return (
      <div className="flex flex-1 flex-col">
        <ScreenHeader title="Edit Split" onBack={() => router.push(`/split/${id}`)} />
        <div className="flex flex-1 items-center justify-center">
          <PretzelIcon size={40} className="animate-pulse" />
        </div>
      </div>
    );
  }

  const totals = computeReceiptTotals(items, vatRate, serviceChargeRate);

  const openEditName = () => {
    setNameDraft(establishment);
    setNameOpen(true);
  };
  const saveEditName = () => {
    setEstablishment(nameDraft.trim() || "Receipt");
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
      const id = itemModal.item.id;
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, name: itemName.trim(), price, quantity } : i)));
    } else {
      setItems((prev) => [...prev, { id: genId("item"), name: itemName.trim(), price, quantity }]);
    }
    setItemModal(null);
  };
  const deleteItem = () => {
    if (!itemModal?.item) return;
    const id = itemModal.item.id;
    setItems((prev) => prev.filter((i) => i.id !== id));
    setAssignments((prev) => prev.filter((a) => a.itemId !== id));
    setItemModal(null);
  };

  const openEditRate = (field: "vat" | "serviceCharge") => {
    const rate = field === "vat" ? vatRate : serviceChargeRate;
    setRateDraft(String(Math.round(rate * 100)));
    setRateModal(field);
  };
  const saveRate = () => {
    const pct = parseFloat(rateDraft);
    if (!Number.isFinite(pct) || pct < 0) return;
    const rate = pct / 100;
    if (rateModal === "vat") setVatRate(rate);
    else if (rateModal === "serviceCharge") setServiceChargeRate(rate);
    setRateModal(null);
  };

  const toggleAssignment = (itemId: string, memberId: string) => {
    setAssignments((prev) => {
      const existing = prev.find((a) => a.itemId === itemId);
      if (!existing) return [...prev, { itemId, memberIds: [memberId] }];
      const has = existing.memberIds.includes(memberId);
      return prev.map((a) =>
        a.itemId === itemId
          ? { ...a, memberIds: has ? a.memberIds.filter((m) => m !== memberId) : [...a.memberIds, memberId] }
          : a
      );
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const finalAssignments: ItemAssignment[] =
        split.method === "even" ? items.map((i) => ({ itemId: i.id, memberIds: split.members.map((m) => m.id) })) : assignments;
      await editSplitReceipt({
        splitId: split.id,
        establishment: establishment || "Receipt",
        items,
        vatRate,
        serviceChargeRate,
        assignments: finalAssignments,
      });
      router.push(`/split/${split.id}`);
    } catch {
      setError("Couldn't save your changes. Please try again.");
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <ScreenHeader title="Edit Split" onBack={() => router.push(`/split/${id}`)} />

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <p className="mb-4 text-center text-xs text-navy/50 dark:text-white/50 font-secondary">
          Everyone&apos;s share updates automatically once you save.
        </p>

        <div
          className="mx-auto w-full max-w-[300px] bg-[#fdfaf2] px-5 py-6 text-navy shadow-md"
          style={{
            fontFamily: "var(--font-secondary)",
            clipPath:
              "polygon(0% 0%,100% 0%,100% 98%,97% 100%,94% 98%,91% 100%,88% 98%,85% 100%,82% 98%,79% 100%,76% 98%,73% 100%,70% 98%,67% 100%,64% 98%,61% 100%,58% 98%,55% 100%,52% 98%,49% 100%,46% 98%,43% 100%,40% 98%,37% 100%,34% 98%,31% 100%,28% 98%,25% 100%,22% 98%,19% 100%,16% 98%,13% 100%,10% 98%,7% 100%,4% 98%,0% 100%)",
          }}
        >
          <button onClick={openEditName} className="flex w-full flex-col items-center gap-1 text-center">
            <span className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-widest">
              {establishment || "Tap to name this receipt"}
              <Pencil size={11} className="text-navy/40" />
            </span>
          </button>

          <div className="my-4 border-t border-dashed border-navy/30" />

          <div className="flex flex-col gap-1">
            {items.length === 0 && <p className="py-2 text-center text-xs text-navy/40">No items yet — add one below.</p>}
            {items.map((item) => (
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
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {vatRate > 0 ? (
                  <button onClick={() => openEditRate("vat")} className="flex items-center gap-1 active:opacity-60">
                    VAT ({Math.round(vatRate * 100)}%)
                    <Pencil size={9} className="text-navy/40" />
                  </button>
                ) : (
                  <span>VAT</span>
                )}
                <span className="scale-75 origin-left">
                  <Switch checked={vatRate > 0} onChange={() => setVatRate(vatRate > 0 ? 0 : 0.12)} />
                </span>
              </span>
              <span>{formatCurrency(totals.vat)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                {serviceChargeRate > 0 ? (
                  <button
                    onClick={() => openEditRate("serviceCharge")}
                    className="flex items-center gap-1 active:opacity-60"
                  >
                    Service Charge ({Math.round(serviceChargeRate * 100)}%)
                    <Pencil size={9} className="text-navy/40" />
                  </button>
                ) : (
                  <span>Service Charge</span>
                )}
                <span className="scale-75 origin-left">
                  <Switch
                    checked={serviceChargeRate > 0}
                    onChange={() => setServiceChargeRate(serviceChargeRate > 0 ? 0 : 0.1)}
                  />
                </span>
              </span>
              <span>{formatCurrency(totals.serviceCharge)}</span>
            </div>
          </div>

          <div className="my-4 border-t border-dashed border-navy/30" />

          <div className="flex justify-between text-sm font-bold">
            <span>GRAND TOTAL</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>
        </div>

        {split.method === "item" && (
          <div className="mt-7">
            <p className="mb-3 text-xs font-bold uppercase tracking-wide text-navy/40 dark:text-white/40 font-secondary">
              Who Ordered (Select All That Apply)
            </p>
            <div className="flex flex-col gap-3">
              {items.map((item) => {
                const assignment = assignments.find((a) => a.itemId === item.id);
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
                      {split.members.map((m) => (
                        <Avatar
                          key={m.id}
                          name={m.name}
                          color={m.avatarColor}
                          size="sm"
                          selected={assignment?.memberIds.includes(m.id) ?? false}
                          onClick={() => toggleAssignment(item.id, m.id)}
                        />
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="px-6 pb-8 pt-2">
        <Button fullWidth size="lg" disabled={items.length === 0 || saving} onClick={handleSave}>
          {saving ? "Saving..." : "Save Changes"}
        </Button>
        {error && <p className="mt-2 text-center text-xs text-orange font-secondary">{error}</p>}
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

      <Modal
        open={!!rateModal}
        onClose={() => setRateModal(null)}
        title={rateModal === "vat" ? "VAT" : "Service Charge"}
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Rate (%)"
            type="number"
            inputMode="decimal"
            placeholder="0"
            value={rateDraft}
            onChange={(e) => setRateDraft(e.target.value)}
            autoFocus
          />
          <Button fullWidth size="lg" onClick={saveRate}>
            Save
          </Button>
        </div>
      </Modal>

      <Modal open={!!itemModal} onClose={() => setItemModal(null)} title={itemModal?.item ? "Edit Item" : "Add Item"}>
        <div className="flex flex-col gap-4">
          <Input
            label="Item Name"
            placeholder="e.g. Chicken Inasal"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            autoFocus
          />
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
