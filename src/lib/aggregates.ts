import { calculateSplitShares, round2 } from "@/lib/splitEngine";
import { hoursSince } from "@/lib/utils";
import type { ShareBreakdown, Split } from "@/types";

export function getSplitShares(split: Split): ShareBreakdown[] {
  const hours = hoursSince(split.createdAt);
  const daysOverdueByMember: Record<string, number> = {};
  split.members.forEach((m) => {
    if (m.status === "pending" && hours > 24) {
      daysOverdueByMember[m.id] = Math.floor((hours - 24) / 24) + 1;
    }
  });

  return calculateSplitShares({
    method: split.method,
    receipt: split.receipt,
    memberIds: split.members.map((m) => m.id),
    assignments: split.assignments,
    daysOverdueByMember,
  });
}

export function getShareForMember(split: Split, memberId: string): ShareBreakdown | undefined {
  return getSplitShares(split).find((s) => s.memberId === memberId);
}

export function getSplitStatus(split: Split): "settled" | "pending" {
  return split.members.every((m) => m.status === "paid") ? "settled" : "pending";
}

export function isOverdue(split: Split): boolean {
  return hoursSince(split.createdAt) > 24;
}

export function getUserBalance(splits: Split[], userId: string) {
  let owe = 0;
  let owed = 0;

  splits.forEach((split) => {
    const shares = getSplitShares(split);
    const isPayee = split.payeeId === userId;

    split.members.forEach((m) => {
      if (m.status !== "pending") return;
      const share = shares.find((s) => s.memberId === m.id);
      if (!share) return;

      if (isPayee && m.id !== userId) {
        owed += share.total;
      } else if (!isPayee && m.id === userId) {
        owe += share.total;
      }
    });
  });

  return { owe: round2(owe), owed: round2(owed) };
}

export function getPaidCount(split: Split): { paid: number; total: number } {
  return { paid: split.members.filter((m) => m.status === "paid").length, total: split.members.length };
}

export function getOverdueDays(split: Split): number {
  const hours = hoursSince(split.createdAt);
  return hours > 24 ? Math.floor((hours - 24) / 24) + 1 : 0;
}

export function getPayableShare(split: Split, memberId: string): ShareBreakdown {
  const overdueDays = getOverdueDays(split);
  const daysOverdueByMember: Record<string, number> = overdueDays > 0 ? { [memberId]: overdueDays } : {};

  const shares = calculateSplitShares({
    method: split.method,
    receipt: split.receipt,
    memberIds: split.members.map((m) => m.id),
    assignments: split.assignments,
    daysOverdueByMember,
    applyConvenienceFeeTo: [memberId],
  });

  return shares.find((s) => s.memberId === memberId)!;
}
