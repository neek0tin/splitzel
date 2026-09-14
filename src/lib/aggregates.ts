import { calculateSplitShares, round2 } from "@/lib/splitEngine";
import { colorForName, hoursSince } from "@/lib/utils";
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

/** A member's share minus what they've logged via partial payments, floored
 *  at 0 for display (an overpayment doesn't produce a negative "still owes"). */
export function getRemainingForMember(split: Split, memberId: string): number {
  const share = getShareForMember(split, memberId);
  const member = split.members.find((m) => m.id === memberId);
  if (!share || !member) return 0;
  return round2(Math.max(0, share.total - member.amountPaid));
}

export function getSplitStatus(split: Split): "settled" | "pending" {
  return split.members.every((m) => m.status === "paid") ? "settled" : "pending";
}

export function isOverdue(split: Split): boolean {
  return hoursSince(split.createdAt) > 24;
}

export function getUserBalance(splits: Split[], currentUserId: string) {
  let owe = 0;
  let owed = 0;

  splits.forEach((split) => {
    const shares = getSplitShares(split);
    // payeeUserId only overrides who's owed on splits where someone else paid;
    // when null, the split's *owner* is the payee — which may not be the
    // viewer, now that a split can show up for anyone in it, not just its owner.
    const payeeId = split.payeeUserId ?? split.ownerId;
    const isPayee = payeeId === currentUserId;

    split.members.forEach((m) => {
      if (m.status !== "pending") return;
      const share = shares.find((s) => s.memberId === m.id);
      if (!share) return;
      const remaining = Math.max(0, share.total - m.amountPaid);

      if (isPayee && !m.isCurrentUser) {
        owed += remaining;
      } else if (!isPayee && m.isCurrentUser) {
        owe += remaining;
      }
    });
  });

  return { owe: round2(owe), owed: round2(owed) };
}

export interface LedgerEntry {
  /** The counterpart's user id, or `guest:<split_member id>` for a guest
   *  (guests have no persistent identity to group across splits by). */
  key: string;
  name: string;
  avatarColor: string;
  theyOweYou: number;
  youOweThem: number;
  splitCount: number;
}

/** A per-person breakdown of outstanding balances across every split the
 *  current user is in, not just one split at a time. */
export function getReimbursementLedger(splits: Split[], currentUserId: string): LedgerEntry[] {
  const entries = new Map<string, LedgerEntry>();
  const getEntry = (key: string, name: string, avatarColor: string) => {
    let entry = entries.get(key);
    if (!entry) {
      entry = { key, name, avatarColor, theyOweYou: 0, youOweThem: 0, splitCount: 0 };
      entries.set(key, entry);
    }
    return entry;
  };

  splits.forEach((split) => {
    const shares = getSplitShares(split);
    const payeeId = split.payeeUserId ?? split.ownerId;
    const isPayee = payeeId === currentUserId;

    if (isPayee) {
      split.members.forEach((m) => {
        if (m.isCurrentUser || m.status !== "pending") return;
        const share = shares.find((s) => s.memberId === m.id);
        if (!share) return;
        const remaining = round2(Math.max(0, share.total - m.amountPaid));
        if (remaining <= 0) return;
        const entry = getEntry(m.userId ?? `guest:${m.id}`, m.name, m.avatarColor);
        entry.theyOweYou = round2(entry.theyOweYou + remaining);
        entry.splitCount += 1;
      });
    } else {
      const me = split.members.find((m) => m.isCurrentUser);
      if (!me || me.status !== "pending") return;
      const share = shares.find((s) => s.memberId === me.id);
      if (!share) return;
      const remaining = round2(Math.max(0, share.total - me.amountPaid));
      if (remaining <= 0) return;
      const payeeMember = split.members.find((m) => m.userId === payeeId);
      const name = payeeMember?.name ?? "Someone";
      const entry = getEntry(payeeId, name, payeeMember?.avatarColor ?? colorForName(name));
      entry.youOweThem = round2(entry.youOweThem + remaining);
      entry.splitCount += 1;
    }
  });

  return [...entries.values()]
    .filter((e) => e.theyOweYou > 0 || e.youOweThem > 0)
    .sort((a, b) => b.theyOweYou - b.youOweThem - (a.theyOweYou - a.youOweThem));
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
