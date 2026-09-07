import { createClient } from "@/lib/supabase/client";
import { colorForName } from "@/lib/utils";
import type {
  AppNotification,
  CurrentUser,
  Friend,
  ItemAssignment,
  NotificationType,
  Receipt,
  Split,
  SplitMember,
  SplitMethod,
} from "@/types";

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

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export type OAuthProvider = "google" | "facebook" | "discord";

/**
 * Starts a real OAuth sign-in and redirects the browser to the provider.
 * If the current session is still anonymous, this links the OAuth identity
 * to it (so the anonymous account's data carries over) instead of creating
 * a brand new user. If that identity already belongs to a different
 * Splitzel account, it falls back to a normal sign-in to that account.
 */
export async function signInWithProvider(provider: OAuthProvider, redirectTo: string): Promise<void> {
  const { data } = await supabase.auth.getSession();

  if (data.session?.user?.is_anonymous) {
    const { error } = await supabase.auth.linkIdentity({ provider, options: { redirectTo } });
    if (!error) return;
  }

  const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo } });
  if (error) throw error;
}

/** Pulls a name hint out of an OAuth provider's profile data (e.g. Google, Facebook, Discord), if any. */
export async function fetchNameHint(): Promise<{ firstName: string; lastName: string } | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const meta = user.user_metadata ?? {};
  // Google uses given_name/family_name; Facebook uses first_name/last_name; Discord has no
  // split name at all (often just a single-word display name/username). All of them also
  // provide a combined name/full_name we can fall back to splitting on whitespace.
  const fullName: string = meta.full_name ?? meta.name ?? "";
  const [fallbackFirst, ...fallbackRest] = fullName.trim().split(/\s+/).filter(Boolean);

  const firstName = meta.given_name ?? meta.first_name ?? fallbackFirst ?? "";
  const lastName = meta.family_name ?? meta.last_name ?? fallbackRest.join(" ") ?? "";

  if (!firstName && !lastName) return null;
  return { firstName, lastName };
}

// ─────────────────────────────────────────────────────────────
// profile
// ─────────────────────────────────────────────────────────────

interface ProfileRow {
  id: string;
  first_name: string;
  last_name: string;
  avatar_color: string;
  friend_code: string;
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
    friendCode: row.friend_code,
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
  patch: Partial<{
    firstName: string;
    lastName: string;
    gcashNumber: string;
    gcashName: string;
    bankName: string;
    bankAccountNumber: string;
    bankAccountName: string;
    hasQr: boolean;
  }>
): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({
      ...(patch.firstName !== undefined && { first_name: patch.firstName }),
      ...(patch.lastName !== undefined && { last_name: patch.lastName }),
      ...(patch.gcashNumber !== undefined && { gcash_number: patch.gcashNumber }),
      ...(patch.gcashName !== undefined && { gcash_name: patch.gcashName }),
      ...(patch.bankName !== undefined && { bank_name: patch.bankName }),
      ...(patch.bankAccountNumber !== undefined && { bank_account_number: patch.bankAccountNumber }),
      ...(patch.bankAccountName !== undefined && { bank_account_name: patch.bankAccountName }),
      ...(patch.hasQr !== undefined && { has_qr: patch.hasQr }),
    })
    .eq("id", userId);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// friends (real, bidirectional connections between accounts)
// ─────────────────────────────────────────────────────────────

interface FriendRow {
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

function mapFriend(row: FriendRow): Friend {
  return {
    id: row.id,
    name: `${row.first_name} ${row.last_name}`.trim(),
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
  const { data, error } = await supabase.rpc("list_my_friends");
  if (error) throw error;
  return ((data ?? []) as FriendRow[]).map(mapFriend);
}

export interface FriendCodeMatch {
  id: string;
  name: string;
  avatarColor: string;
}

/** Looks someone up by their friend code, without connecting yet — for a confirm-before-adding step. */
export async function findFriendByCode(code: string): Promise<FriendCodeMatch | null> {
  const { data, error } = await supabase.rpc("find_profile_by_friend_code", { p_code: code.trim() });
  if (error) throw error;
  const row = data?.[0] as { id: string; first_name: string; last_name: string; avatar_color: string } | undefined;
  if (!row) return null;
  return { id: row.id, name: `${row.first_name} ${row.last_name}`.trim(), avatarColor: row.avatar_color };
}

/** Creates the (undirected) connection between two accounts. */
export async function connectFriend(myId: string, theirId: string): Promise<void> {
  const [user_id_1, user_id_2] = myId < theirId ? [myId, theirId] : [theirId, myId];
  const { error } = await supabase.from("friend_connections").insert({ user_id_1, user_id_2 });
  if (error) {
    if (error.code === "23505") throw new Error("You're already connected with this person.");
    throw error;
  }
}

export async function removeFriendConnection(myId: string, theirId: string): Promise<void> {
  const [a, b] = myId < theirId ? [myId, theirId] : [theirId, myId];
  const { error } = await supabase.from("friend_connections").delete().eq("user_id_1", a).eq("user_id_2", b);
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// splits (receipts + items + members + item assignments)
// ─────────────────────────────────────────────────────────────

const SPLIT_SELECT = `
  id, method, payee_user_id, created_at,
  owner:profiles!splits_owner_id_fkey ( id, first_name, last_name, avatar_color ),
  receipt:receipts (
    id, establishment, receipt_date, subtotal, vat_rate, service_charge_rate, vat, service_charge, total,
    items:receipt_items ( id, name, price, quantity )
  ),
  members:split_members ( id, member_type, user_id, guest_name, status, paid_at ),
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
  payee_user_id: string | null;
  created_at: string;
  owner: { id: string; first_name: string; last_name: string; avatar_color: string };
  receipt: RawReceiptRow;
  members: {
    id: string;
    member_type: "me" | "friend" | "guest";
    user_id: string | null;
    guest_name: string | null;
    status: "pending" | "paid";
    paid_at: string | null;
  }[];
  assignments: { id: string; receipt_item_id: string; split_member_id: string }[];
}

/**
 * A split can now be viewed by anyone in it, not just its owner (e.g. tapping a
 * notification into a split a friend created). "me" in the raw data always means
 * the split's *owner* — who that actually is relative to the *viewer* has to be
 * resolved here rather than trusted from the stored label.
 */
function mapSplit(row: RawSplitRow, friendsById: Map<string, Friend>, viewer: { id: string; avatarColor: string }): Split {
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
      const isViewer = row.owner.id === viewer.id;
      return {
        id: m.id,
        name: isViewer ? "You" : `${row.owner.first_name} ${row.owner.last_name}`.trim(),
        avatarColor: row.owner.avatar_color,
        isGuest: false,
        isCurrentUser: isViewer,
        status: m.status,
        paidAt: m.paid_at ?? undefined,
      };
    }
    if (m.member_type === "friend") {
      const isViewer = m.user_id === viewer.id;
      const friend = m.user_id ? friendsById.get(m.user_id) : undefined;
      return {
        id: m.id,
        name: isViewer ? "You" : (friend?.name ?? "Unknown Friend"),
        avatarColor: isViewer ? viewer.avatarColor : (friend?.avatarColor ?? colorForName(friend?.name ?? m.id)),
        isGuest: false,
        isCurrentUser: isViewer,
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
    ownerId: row.owner.id,
    receipt,
    method: row.method,
    members,
    assignments,
    createdAt: row.created_at,
    payeeUserId: row.payee_user_id,
  };
}

export async function fetchSplits(
  friendsById: Map<string, Friend>,
  viewer: { id: string; avatarColor: string }
): Promise<Split[]> {
  const { data, error } = await supabase
    .from("splits")
    .select(SPLIT_SELECT)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as unknown as RawSplitRow[]).map((row) => mapSplit(row, friendsById, viewer));
}

export async function createSplit(params: {
  ownerId: string;
  receipt: Receipt;
  method: SplitMethod;
  members: SplitMember[];
  assignments: ItemAssignment[];
  payeeUserId: string | null;
}): Promise<string> {
  const { ownerId, receipt, method, members, assignments, payeeUserId } = params;

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
    .insert({ owner_id: ownerId, receipt_id: receiptRow.id, method, payee_user_id: payeeUserId })
    .select()
    .single();
  if (splitErr) throw splitErr;

  const { data: memberRows, error: membersErr } = await supabase
    .from("split_members")
    .insert(
      members.map((m) => ({
        split_id: splitRow.id,
        member_type: m.isCurrentUser ? "me" : m.isGuest ? "guest" : "friend",
        user_id: !m.isCurrentUser && !m.isGuest ? m.id : null,
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
  const { error } = await supabase.rpc("mark_split_member_paid", { p_split_member_id: splitMemberId });
  if (error) throw error;
}

export async function nudgeSplitMember(splitMemberId: string): Promise<void> {
  const { error } = await supabase.rpc("nudge_split_member", { p_split_member_id: splitMemberId });
  if (error) throw error;
}

// ─────────────────────────────────────────────────────────────
// notifications
// ─────────────────────────────────────────────────────────────

interface NotificationRow {
  id: string;
  type: NotificationType;
  split_id: string | null;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

function mapNotification(row: NotificationRow): AppNotification {
  return {
    id: row.id,
    type: row.type,
    splitId: row.split_id,
    title: row.title,
    body: row.body,
    read: row.read,
    createdAt: row.created_at,
  };
}

export async function fetchNotifications(): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, split_id, title, body, read, created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return ((data ?? []) as NotificationRow[]).map(mapNotification);
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
  if (error) throw error;
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("read", false);
  if (error) throw error;
}

/** Subscribes to new notifications for this user in real time. Returns an unsubscribe function. */
export function subscribeToNotifications(userId: string, onInsert: (n: AppNotification) => void): () => void {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      (payload) => onInsert(mapNotification(payload.new as NotificationRow))
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
