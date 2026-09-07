import type { ItemAssignment, Receipt, ShareBreakdown, SplitMethod } from "@/types";

export const LATE_FEE_PER_DAY = 5;
export const CONVENIENCE_FEE = 5;

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

interface CalculateSplitSharesParams {
  method: SplitMethod;
  receipt: Receipt;
  memberIds: string[];
  assignments: ItemAssignment[];
  /** days overdue per member (0 or omitted = not overdue) */
  daysOverdueByMember?: Record<string, number>;
  /** member ids that should have the flat convenience fee applied (typically on settlement) */
  applyConvenienceFeeTo?: string[];
}

/**
 * Core Splitzel math engine.
 *
 * 1. Computes each diner's subtotal of assigned line items (shared items split evenly
 *    among tagged assignees, or the bill divided evenly across all members).
 * 2. Distributes VAT + Service Charge proportionally to each diner's share of the subtotal.
 * 3. Adds a late penalty (₱5/day overdue) and the flat ₱5 Splitzel convenience fee when applicable.
 * 4. Rounds every monetary value to 2 decimal places.
 */
export function calculateSplitShares({
  method,
  receipt,
  memberIds,
  assignments,
  daysOverdueByMember = {},
  applyConvenienceFeeTo = [],
}: CalculateSplitSharesParams): ShareBreakdown[] {
  const memberSubtotals: Record<string, number> = {};
  memberIds.forEach((id) => {
    memberSubtotals[id] = 0;
  });

  if (method === "even") {
    const evenShare = memberIds.length > 0 ? receipt.subtotal / memberIds.length : 0;
    memberIds.forEach((id) => {
      memberSubtotals[id] = evenShare;
    });
  } else {
    for (const item of receipt.items) {
      const assignment = assignments.find((a) => a.itemId === item.id);
      const assignees = assignment?.memberIds.filter((id) => memberIds.includes(id)) ?? [];
      if (assignees.length === 0) continue;
      const itemTotal = item.price * item.quantity;
      const perPerson = itemTotal / assignees.length;
      assignees.forEach((id) => {
        memberSubtotals[id] = (memberSubtotals[id] ?? 0) + perPerson;
      });
    }
  }

  const totalTaxAndService = receipt.vat + receipt.serviceCharge;
  const billSubtotal = receipt.subtotal;

  return memberIds.map((id) => {
    const subtotal = memberSubtotals[id] ?? 0;
    const ratio = billSubtotal > 0 ? subtotal / billSubtotal : 0;
    const taxServiceCharge = totalTaxAndService * ratio;
    const daysOverdue = daysOverdueByMember[id] ?? 0;
    const lateFee = daysOverdue > 0 ? daysOverdue * LATE_FEE_PER_DAY : 0;
    const convenienceFee = applyConvenienceFeeTo.includes(id) ? CONVENIENCE_FEE : 0;
    const total = subtotal + taxServiceCharge + lateFee + convenienceFee;

    return {
      memberId: id,
      subtotal: round2(subtotal),
      taxServiceCharge: round2(taxServiceCharge),
      lateFee: round2(lateFee),
      convenienceFee: round2(convenienceFee),
      total: round2(total),
    };
  });
}

export function computeReceiptTotals(
  items: { price: number; quantity: number }[],
  vatRate: number,
  serviceChargeRate: number
) {
  const subtotal = round2(items.reduce((sum, i) => sum + i.price * i.quantity, 0));
  const vat = round2(subtotal * vatRate);
  const serviceCharge = round2(subtotal * serviceChargeRate);
  const total = round2(subtotal + vat + serviceCharge);
  return { subtotal, vat, serviceCharge, total };
}
