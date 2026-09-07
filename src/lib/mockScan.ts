import { computeReceiptTotals } from "@/lib/splitEngine";
import type { Receipt } from "@/types";

function buildReceipt(
  id: string,
  establishment: string,
  date: string,
  items: { id: string; name: string; price: number; quantity: number }[]
): Receipt {
  const totals = computeReceiptTotals(items, 0.12, 0.1);
  return { id, establishment, date, items, ...totals, vatRate: 0.12, serviceChargeRate: 0.1 };
}

/**
 * Placeholder for real OCR/AI receipt scanning (not yet implemented).
 * Returns a randomly picked, fully-formed fake receipt so the rest of the
 * split flow (verify → choose method → assign → summary) can be built and
 * tested end-to-end ahead of wiring up a real vision/OCR API.
 */
export function generateMockScannedReceipt(): Receipt {
  const templates = [
    () =>
      buildReceipt(`scan_${Date.now()}`, "Cafe Juanita", new Date().toISOString(), [
        { id: "si1", name: "Aglio Olio", price: 195, quantity: 1 },
        { id: "si2", name: "Pancit Canton", price: 155, quantity: 1 },
        { id: "si3", name: "Iced Tea", price: 75, quantity: 2 },
        { id: "si4", name: "Garlic Bread", price: 95, quantity: 1 },
      ]),
    () =>
      buildReceipt(`scan_${Date.now()}`, "Tapa King", new Date().toISOString(), [
        { id: "si5", name: "Tapa Meal", price: 159, quantity: 2 },
        { id: "si6", name: "Bangsilog", price: 145, quantity: 1 },
        { id: "si7", name: "Iced Coffee", price: 79, quantity: 3 },
      ]),
    () =>
      buildReceipt(`scan_${Date.now()}`, "Army Navy", new Date().toISOString(), [
        { id: "si8", name: "Angus Burger", price: 189, quantity: 2 },
        { id: "si9", name: "Loaded Fries", price: 149, quantity: 1 },
        { id: "si10", name: "Iced Tea", price: 69, quantity: 2 },
      ]),
  ];
  const pick = templates[Math.floor(Math.random() * templates.length)];
  return pick();
}
