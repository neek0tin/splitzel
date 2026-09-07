"use client";

import { create } from "zustand";
import {
  connectFriend as connectFriendRow,
  createSplit,
  ensureSession,
  fetchFriends,
  fetchNotifications as fetchNotificationsQuery,
  fetchProfile,
  fetchSplits,
  findFriendByCode as findFriendByCodeQuery,
  markAllNotificationsRead as markAllNotificationsReadQuery,
  markNotificationRead as markNotificationReadQuery,
  markSplitMemberPaid,
  nudgeSplitMember,
  removeFriendConnection,
  subscribeToNotifications,
  updateProfile,
  type FriendCodeMatch,
} from "@/lib/supabase/queries";
import type {
  AppNotification,
  CurrentUser,
  DraftScan,
  Friend,
  ItemAssignment,
  Receipt,
  Split,
  SplitMember,
  SplitMethod,
} from "@/types";

/** Local-only sentinel id for "me" inside an in-progress (not yet saved) draft split. */
const DRAFT_SELF_ID = "me";

/** Guards against subscribing more than once per page load (hydrate() can be called from multiple mount points). */
let notificationsUnsubscribe: (() => void) | null = null;

interface AppState {
  initialized: boolean;
  loading: boolean;
  error: string | null;

  user: CurrentUser | null;
  friends: Friend[];
  splits: Split[];
  notifications: AppNotification[];
  draft: DraftScan;
  darkMode: boolean;

  hydrate: () => Promise<CurrentUser | null>;

  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  nudgeMember: (splitMemberId: string) => Promise<void>;

  setUserName: (firstName: string, lastName: string) => Promise<void>;
  updateUserPayment: (
    payment: Partial<{
      gcashNumber: string;
      gcashName: string;
      bankName: string;
      bankAccountNumber: string;
      bankAccountName: string;
      hasQr: boolean;
    }>
  ) => Promise<void>;
  toggleDarkMode: () => void;

  findFriendByCode: (code: string) => Promise<FriendCodeMatch | null>;
  connectFriend: (theirId: string) => Promise<void>;
  removeFriend: (theirId: string) => Promise<void>;

  startDraftFromReceipt: (receipt: Receipt) => void;
  setDraftMethod: (method: SplitMethod) => void;
  addDraftMember: (member: SplitMember) => void;
  removeDraftMember: (memberId: string) => void;
  toggleItemAssignment: (itemId: string, memberId: string) => void;
  clearDraft: () => void;
  finalizeSplit: () => Promise<string>;

  markMemberPaid: (splitId: string, memberId: string) => Promise<void>;
}

const emptyDraft: DraftScan = {
  receipt: null,
  method: null,
  members: [],
  assignments: [],
};

export const useAppStore = create<AppState>((set, get) => ({
  initialized: false,
  loading: false,
  error: null,

  user: null,
  friends: [],
  splits: [],
  notifications: [],
  draft: emptyDraft,
  darkMode: false,

  hydrate: async () => {
    if (get().initialized || get().loading) return get().user;
    set({ loading: true, error: null });
    try {
      const userId = await ensureSession();
      const user = await fetchProfile(userId);
      const friends = await fetchFriends();
      const friendsById = new Map(friends.map((f) => [f.id, f]));
      const splits = await fetchSplits(friendsById, { id: user.id, avatarColor: user.avatarColor });
      set({ user, friends, splits, initialized: true, loading: false });

      // Notifications are best-effort: if this table/migration isn't in place yet
      // (or the fetch fails for any other reason), the rest of the app must still
      // load normally rather than getting stuck initializing forever.
      fetchNotificationsQuery()
        .then((notifications) => set({ notifications }))
        .catch((err) => console.error("Failed to load notifications:", err));

      if (!notificationsUnsubscribe) {
        try {
          notificationsUnsubscribe = subscribeToNotifications(userId, (n) => {
            set((state) => ({ notifications: [n, ...state.notifications] }));
          });
        } catch (err) {
          console.error("Failed to subscribe to notifications:", err);
        }
      }

      return user;
    } catch (err) {
      set({ loading: false, error: err instanceof Error ? err.message : "Failed to load your data." });
      return null;
    }
  },

  markNotificationRead: async (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
    await markNotificationReadQuery(id);
  },

  markAllNotificationsRead: async () => {
    const userId = get().user?.id;
    if (!userId) return;
    set((state) => ({ notifications: state.notifications.map((n) => ({ ...n, read: true })) }));
    await markAllNotificationsReadQuery(userId);
  },

  nudgeMember: async (splitMemberId) => {
    await nudgeSplitMember(splitMemberId);
  },

  setUserName: async (firstName, lastName) => {
    const userId = await ensureSession();
    await updateProfile(userId, { firstName, lastName, gcashName: `${firstName} ${lastName}` });
    set((state) => ({
      user: state.user
        ? { ...state.user, firstName, lastName, payment: { ...state.user.payment, gcashName: `${firstName} ${lastName}` } }
        : state.user,
    }));
  },

  updateUserPayment: async (payment) => {
    const userId = await ensureSession();
    await updateProfile(userId, payment);
    set((state) => ({
      user: state.user ? { ...state.user, payment: { ...state.user.payment, ...payment } } : state.user,
    }));
  },

  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

  findFriendByCode: async (code) => {
    return findFriendByCodeQuery(code);
  },

  connectFriend: async (theirId) => {
    const userId = await ensureSession();
    await connectFriendRow(userId, theirId);
    const friends = await fetchFriends();
    set({ friends });
  },

  removeFriend: async (theirId) => {
    const userId = await ensureSession();
    await removeFriendConnection(userId, theirId);
    set((state) => ({ friends: state.friends.filter((f) => f.id !== theirId) }));
  },

  startDraftFromReceipt: (receipt) =>
    set(() => ({
      draft: {
        receipt,
        method: null,
        members: [
          {
            id: DRAFT_SELF_ID,
            name: "You",
            avatarColor: "#192F4D",
            isGuest: false,
            isCurrentUser: true,
            status: "pending",
          },
        ],
        assignments: receipt.items.map((i) => ({ itemId: i.id, memberIds: [] })),
      },
    })),

  setDraftMethod: (method) => set((state) => ({ draft: { ...state.draft, method } })),

  addDraftMember: (member) =>
    set((state) => {
      if (state.draft.members.some((m) => m.id === member.id)) return state;
      return { draft: { ...state.draft, members: [...state.draft.members, member] } };
    }),

  removeDraftMember: (memberId) =>
    set((state) => ({
      draft: {
        ...state.draft,
        members: state.draft.members.filter((m) => m.id !== memberId),
        assignments: state.draft.assignments.map((a) => ({
          ...a,
          memberIds: a.memberIds.filter((id) => id !== memberId),
        })),
      },
    })),

  toggleItemAssignment: (itemId, memberId) =>
    set((state) => ({
      draft: {
        ...state.draft,
        assignments: state.draft.assignments.map((a) => {
          if (a.itemId !== itemId) return a;
          const has = a.memberIds.includes(memberId);
          return {
            ...a,
            memberIds: has ? a.memberIds.filter((id) => id !== memberId) : [...a.memberIds, memberId],
          };
        }),
      },
    })),

  clearDraft: () => set(() => ({ draft: emptyDraft })),

  finalizeSplit: async () => {
    const { draft } = get();
    if (!draft.receipt || !draft.method) return "";

    const userId = await ensureSession();
    const assignments: ItemAssignment[] =
      draft.method === "even"
        ? draft.receipt.items.map((i) => ({ itemId: i.id, memberIds: draft.members.map((m) => m.id) }))
        : draft.assignments;

    const newSplitId = await createSplit({
      ownerId: userId,
      receipt: draft.receipt,
      method: draft.method,
      // the split's creator has already paid the bill in full up front, so their
      // own share starts out settled — everyone else owes *them*, not the other
      // way around.
      members: draft.members.map((m) => (m.isCurrentUser ? { ...m, status: "paid" as const } : m)),
      assignments,
      payeeUserId: null,
    });

    const friendsById = new Map(get().friends.map((f) => [f.id, f]));
    const currentUser = get().user;
    const splits = await fetchSplits(friendsById, {
      id: userId,
      avatarColor: currentUser?.avatarColor ?? "#192F4D",
    });
    set({ splits });

    return newSplitId;
  },

  markMemberPaid: async (splitId, memberId) => {
    await markSplitMemberPaid(memberId);
    set((state) => ({
      splits: state.splits.map((s) =>
        s.id !== splitId
          ? s
          : {
              ...s,
              members: s.members.map((m) =>
                m.id === memberId ? { ...m, status: "paid" as const, paidAt: new Date().toISOString() } : m
              ),
            }
      ),
    }));
  },
}));
