import { createClient } from "@/lib/supabase/client";
import { colorForName } from "@/lib/utils";
import type { CurrentUser, Friend, ItemAssignment, Receipt, Split, SplitMember, SplitMethod } from "@/types";

const supabase = createClient();

// ─────────────────────────────────────────────────────────────
// session
// ─────────────────────────────────────────────────────────────

/** Returns the current auth user id, creating an anonymous session if none exists yet. */
export async function ensureSession(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user.id;

  const { data: signInData, error } = await supabase.auth.signInAnonymously();
  if (error || !signInData.user) {
    throw error ?? new Error("Could not start a Splitzel session.");
  }
  return signInData.user.id;
}

// ─────────────────────────────────────────────────────────────
// profile
// ─────────────────────────────────────────────────────────────

interface ProfileRow {
  id: string;
  first_name: string;
  last_name: string;
  avatar_color: string;
  gcash_number: string | null;
  gcash_name: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  has_qr: boolean;
}

function mapProfile(row: ProfileRow): CurrentUser {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    avatarColor: row.avatar_color,
    payment: {
      gcashNumber: row.gcash_number ?? undefined,
      gcashName: row.gcash_name ?? undefined,
      bankName: row.bank_name ?? undefined,
      bankAccountNumber: row.bank_account_number ?? undefined,
      bankAccountName: row.bank_account_name ?? undefined,
      hasQr: row.has_qr,
    },
  };
}

export async function fetchProfile(userId: string): Promise<CurrentUser> {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) throw error;
  return mapProfile(data);
}

export async function updateProfile(
  userId: string,
  patch: Partial<{ firstName: string; lastName: string; gcashNumber: string; gcashName: string }>
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      ...(patch.firstName !== undefined && { first_name: patch.firstName }),
      ...(patch.lastName !== undefined && { last_name: patch.lastName }),
      ...(patch.gcashNumber !== undefined && { gcash_number: patch.gcashNumber }),
      ...(patch.gcashName !== undefined && { gcash_name: patch.gcashName }),
    })
    .eq("id", userId);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// friends
// ─────────────────────────────────────────────────────────────

interface FriendRow {
  id: string;
  name: string;
  phone: string | null;
  avatar_color: string;
  gcash_number: string | null;
  gcash_name: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  has_qr: boolean;
}

function mapFriend(row: FriendRow): Friend {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? "",
    avatarColor: row.avatar_color,
    payment: {
      gcashNumber: row.gcash_number ?? undefined,
      gcashName: row.gcash_name ?? undefined,
      bankName: row.bank_name ?? undefined,
      bankAccountNumber: row.bank_account_number ?? undefined,
      bankAccountName: row.bank_account_name ?? undefined,
      hasQr: row.has_qr,
    },
  };
}

export async function fetchFriends(): Promise<Friend[]> {
  const { data, error } = await supabase.from("friends").select("*").order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapFriend);
}

export async function insertFriend(ownerId: string, friend: Omit<Friend, "id">): Promise<Friend> {
  const { data, error } = await supabase
    .from("friends")
    .insert({
      owner_id: ownerId,
      name: friend.name,
      phone: friend.phone || null,
      avatar_color: friend.avatarColor,
      gcash_number: friend.payment.gcashNumber ?? null,
      gcash_name: friend.payment.gcashName ?? null,
      bank_name: friend.payment.bankName ?? null,
      bank_account_number: friend.payment.bankAccountNumber ?? null,
      bank_account_name: friend.payment.bankAccountName ?? null,
      has_qr: friend.payment.hasQr ?? false,
    })
    .select()
    .single();
  if (error) throw error;
  return mapFriend(data);
}

export async function deleteFriend(friendId: string): Promise<void> {
  const { error } = await supabase.from("friends").delete().eq("id", friendId);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// splits (receipts + items + members + item assignments)
// ─────────────────────────────────────────────────────────────

const SPLIT_SELECT = `
  id, method, payee_friend_id, created_at,
  receipt:receipts (
    id, establishment, receipt_date, subtotal, vat_rate, service_charge_rate, vat, service_charge, total,
    items:receipt_items ( id, name, price, quantity )
  ),
  members:split_members ( id, member_type, friend_id, guest_name, status, paid_at ),
  assignments:split_item_assignments ( id, receipt_item_id, split_member_id )
`;

interface RawReceiptRow {
  id: string;
  establishment: string;
  receipt_date: string;
  subtotal: number;
  vat_rate: number;
  service_charge_rate: number;
  vat: number;
  service_charge: number;
  total: number;
  items: { id: string; name: string; price: number; quantity: number }[];
}

interface RawSplitRow {
  id: string;
  method: SplitMethod;
  payee_friend_id: string | null;
  created_at: string;
  receipt: RawReceiptRow;
  members: {
    id: string;
    member_type: "me" | "friend" | "guest";
    friend_id: string | null;
    guest_name: string | null;
    status: "pending" | "paid";
    paid_at: string | null;
  }[];
  assignments: { id: string; receipt_item_id: string; split_member_id: string }[];
}

function mapSplit(row: RawSplitRow, friendsById: Map<string, Friend>, myAvatarColor: string): Split {
  const receipt: Receipt = {
    id: row.receipt.id,
    establishment: row.receipt.establishment,
    date: row.receipt.receipt_date,
    items: row.receipt.items.map((i) => ({ id: i.id, name: i.name, price: i.price, quantity: i.quantity })),
    subtotal: row.receipt.subtotal,
    vatRate: row.receipt.vat_rate,
    serviceChargeRate: row.receipt.service_charge_rate,
    vat: row.receipt.vat,
    serviceCharge: row.receipt.service_charge,
    total: row.receipt.total,
  };

  const members: SplitMember[] = row.members.map((m) => {
    if (m.member_type === "me") {
      return {
        id: m.id,
        name: "You",
        avatarColor: myAvatarColor,
        isGuest: false,
        isCurrentUser: true,
        status: m.status,
        paidAt: m.paid_at ?? undefined,
      };
    }
    if (m.member_type === "friend") {
      const friend = m.friend_id ? friendsById.get(m.friend_id) : undefined;
      return {
        id: m.id,
        name: friend?.name ?? "Unknown Friend",
        avatarColor: friend?.avatarColor ?? colorForName(friend?.name ?? m.id),
        isGuest: false,
        isCurrentUser: false,
        status: m.status,
        paidAt: m.paid_at ?? undefined,
      };
    }
    const guestName = m.guest_name ?? "Guest";
    return {
      id: m.id,
      name: `${guestName} (Guest)`,
      avatarColor: colorForName(guestName),
      isGuest: true,
      isCurrentUser: false,
      status: m.status,
      paidAt: m.paid_at ?? undefined,
    };
  });

  const assignmentsByItem = new Map<string, string[]>();
  row.assignments.forEach((a) => {
    const list = assignmentsByItem.get(a.receipt_item_id) ?? [];
    list.push(a.split_member_id);
    assignmentsByItem.set(a.receipt_item_id, list);
  });
  const assignments: ItemAssignment[] = receipt.items.map((item) => ({
    itemId: item.id,
    memberIds: assignmentsByItem.get(item.id) ?? [],
  }));

  return {
    id: row.id,
    receipt,
    method: row.method,
    members,
    assignments,
    createdAt: row.created_at,
    payeeFriendId: row.payee_friend_id,
  };
}

export async function fetchSplits(friendsById: Map<string, Friend>, myAvatarColor: string): Promise<Split[]> {
  const { data, error } = await supabase
    .from("splits")
    .select(SPLIT_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as RawSplitRow[]).map((row) => mapSplit(row, friendsById, myAvatarColor));
}

export async function createSplit(params: {
  ownerId: string;
  receipt: Receipt;
  method: SplitMethod;
  members: SplitMember[];
  assignments: ItemAssignment[];
  payeeFriendId: string | null;
}): Promise<string> {
  const { ownerId, receipt, method, members, assignments, payeeFriendId } = params;

  const { data: receiptRow, error: receiptErr } = await supabase
    .from("receipts")
    .insert({
      owner_id: ownerId,
      establishment: receipt.establishment,
      receipt_date: receipt.date,
      subtotal: receipt.subtotal,
      vat_rate: receipt.vatRate,
      service_charge_rate: receipt.serviceChargeRate,
      vat: receipt.vat,
      service_charge: receipt.serviceCharge,
      total: receipt.total,
    })
    .select()
    .single();
  if (receiptErr) throw receiptErr;

  const { data: itemRows, error: itemsErr } = await supabase
    .from("receipt_items")
    .insert(receipt.items.map((i) => ({ receipt_id: receiptRow.id, name: i.name, price: i.price, quantity: i.quantity })))
    .select();
  if (itemsErr) throw itemsErr;
  const itemIdMap = new Map<string, string>();
  receipt.items.forEach((draftItem, idx) => itemIdMap.set(draftItem.id, itemRows[idx].id));

  const { data: splitRow, error: splitErr } = await supabase
    .from("splits")
    .insert({ owner_id: ownerId, receipt_id: receiptRow.id, method, payee_friend_id: payeeFriendId })
    .select()
    .single();
  if (splitErr) throw splitErr;

  const { data: memberRows, error: membersErr } = await supabase
    .from("split_members")
    .insert(
      members.map((m) => ({
        split_id: splitRow.id,
        member_type: m.isCurrentUser ? "me" : m.isGuest ? "guest" : "friend",
        friend_id: !m.isCurrentUser && !m.isGuest ? m.id : null,
        guest_name: m.isGuest ? m.name.replace(/\s*\(Guest\)$/, "") : null,
        status: m.status,
      }))
    )
    .select();
  if (membersErr) throw membersErr;
  const memberIdMap = new Map<string, string>();
  members.forEach((draftMember, idx) => memberIdMap.set(draftMember.id, memberRows[idx].id));

  if (method === "item") {
    const assignmentInserts: { split_id: string; receipt_item_id: string; split_member_id: string }[] = [];
    assignments.forEach((a) => {
      const realItemId = itemIdMap.get(a.itemId);
      if (!realItemId) return;
      a.memberIds.forEach((mid) => {
        const realMemberId = memberIdMap.get(mid);
        if (!realMemberId) return;
        assignmentInserts.push({ split_id: splitRow.id, receipt_item_id: realItemId, split_member_id: realMemberId });
      });
    });
    if (assignmentInserts.length > 0) {
      const { error: assignErr } = await supabase.from("split_item_assignments").insert(assignmentInserts);
      if (assignErr) throw assignErr;
    }
  }

  return splitRow.id;
}

export async function markSplitMemberPaid(splitMemberId: string): Promise<void> {
  const { error } = await supabase
    .from("split_members")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", splitMemberId);
  if (error) throw error;
}
