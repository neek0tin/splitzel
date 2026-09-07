"use client";

import { create } from "zustand";
import { CURRENT_USER_ID, mockFriends, mockSplits } from "@/lib/mockData";
import { genId } from "@/lib/utils";
import type {
  CurrentUser,
  DraftScan,
  Friend,
  ItemAssignment,
  Receipt,
  Split,
  SplitMember,
  SplitMethod,
} from "@/types";

interface AppState {
  user: CurrentUser;
  friends: Friend[];
  splits: Split[];
  draft: DraftScan;
  darkMode: boolean;

  setUserName: (firstName: string, lastName: string) => void;
  completeOnboarding: () => void;
  updateUserPayment: (payment: Partial<CurrentUser["payment"]>) => void;
  toggleDarkMode: () => void;

  addFriend: (friend: Omit<Friend, "id">) => void;

  startDraftFromReceipt: (receipt: Receipt) => void;
  setDraftMethod: (method: SplitMethod) => void;
  addDraftMember: (member: SplitMember) => void;
  removeDraftMember: (memberId: string) => void;
  toggleItemAssignment: (itemId: string, memberId: string) => void;
  clearDraft: () => void;
  finalizeSplit: () => string;

  markMemberPaid: (splitId: string, memberId: string) => void;
}

const emptyDraft: DraftScan = {
  receipt: null,
  method: null,
  members: [],
  assignments: [],
};

export const useAppStore = create<AppState>((set, get) => ({
  user: {
    firstName: "",
    lastName: "",
    avatarColor: "#192F4D",
    onboarded: false,
    payment: {
      gcashNumber: "0917 111 2222",
      gcashName: "",
      hasQr: false,
    },
  },
  friends: mockFriends,
  splits: mockSplits,
  draft: emptyDraft,
  darkMode: false,

  setUserName: (firstName, lastName) =>
    set((state) => ({
      user: { ...state.user, firstName, lastName, payment: { ...state.user.payment, gcashName: `${firstName} ${lastName}` } },
    })),

  completeOnboarding: () =>
    set((state) => ({ user: { ...state.user, onboarded: true } })),

  updateUserPayment: (payment) =>
    set((state) => ({ user: { ...state.user, payment: { ...state.user.payment, ...payment } } })),

  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

  addFriend: (friend) =>
    set((state) => ({ friends: [...state.friends, { ...friend, id: genId("f") }] })),

  startDraftFromReceipt: (receipt) =>
    set(() => ({
      draft: {
        receipt,
        method: null,
        members: [
          {
            id: CURRENT_USER_ID,
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

  finalizeSplit: () => {
    const { draft } = get();
    if (!draft.receipt || !draft.method) return "";
    const assignments: ItemAssignment[] =
      draft.method === "even"
        ? draft.receipt.items.map((i) => ({ itemId: i.id, memberIds: draft.members.map((m) => m.id) }))
        : draft.assignments;

    const newSplit: Split = {
      id: genId("s"),
      receipt: draft.receipt,
      method: draft.method,
      members: draft.members.map((m) => (m.isCurrentUser ? { ...m, status: "paid" as const } : m)),
      assignments,
      createdAt: new Date().toISOString(),
      payeeId: CURRENT_USER_ID,
    };

    set((state) => ({ splits: [newSplit, ...state.splits] }));
    return newSplit.id;
  },

  markMemberPaid: (splitId, memberId) =>
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
    })),
}));
