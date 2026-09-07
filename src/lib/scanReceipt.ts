import { computeReceiptTotals } from "@/lib/splitEngine";
import { genId } from "@/lib/utils";
import type { Receipt } from "@/types";

interface ScanResult {
  establishment: string;
  items: { name: string; price: number; quantity: number }[];
}

/** Sends a captured/uploaded photo to the server for AI extraction, returning a full draft Receipt. */
export async function scanReceiptImage(imageDataUrl: string): Promise<Receipt> {
  const res = await fetch("/api/scan-receipt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image: imageDataUrl }),
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error || "Couldn't process the receipt. Please try again.");
  }

  const result = body as ScanResult;
  const items = result.items.map((i) => ({ id: genId("item"), name: i.name, price: i.price, quantity: i.quantity }));
  const totals = computeReceiptTotals(items, 0.12, 0.1);

  return {
    id: genId("receipt"),
    establishment: result.establishment,
    date: new Date().toISOString(),
    items,
    vatRate: 0.12,
    serviceChargeRate: 0.1,
    ...totals,
  };
}
