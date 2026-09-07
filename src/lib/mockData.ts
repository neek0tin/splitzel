import { computeReceiptTotals } from "@/lib/splitEngine";
import { colorForName } from "@/lib/utils";
import type { Friend, ItemAssignment, Receipt, Split, SplitMember } from "@/types";

export const CURRENT_USER_ID = "me";

export const mockFriends: Friend[] = [
  {
    id: "f1",
    name: "Miguel Santos",
    phone: "0917 234 5678",
    avatarColor: colorForName("Miguel Santos"),
    payment: {
      gcashNumber: "0917 234 5678",
      gcashName: "Miguel Santos",
      bankName: "BPI",
      bankAccountNumber: "1234 5678 90",
      bankAccountName: "Miguel Santos",
      hasQr: true,
    },
  },
  {
    id: "f2",
    name: "Andrea Cruz",
    phone: "0918 345 6789",
    avatarColor: colorForName("Andrea Cruz"),
    payment: {
      gcashNumber: "0918 345 6789",
      gcashName: "Andrea Cruz",
      bankName: "BDO",
      bankAccountNumber: "2233 4455 66",
      bankAccountName: "Andrea Cruz",
      hasQr: true,
    },
  },
  {
    id: "f3",
    name: "Paolo Reyes",
    phone: "0919 456 7890",
    avatarColor: colorForName("Paolo Reyes"),
    payment: {
      gcashNumber: "0919 456 7890",
      gcashName: "Paolo Reyes",
      hasQr: false,
    },
  },
  {
    id: "f4",
    name: "Bea Fernandez",
    phone: "0920 567 8901",
    avatarColor: colorForName("Bea Fernandez"),
    payment: {
      gcashNumber: "0920 567 8901",
      gcashName: "Bea Fernandez",
      bankName: "UnionBank",
      bankAccountNumber: "9988 7766 55",
      bankAccountName: "Bea Fernandez",
      hasQr: true,
    },
  },
  {
    id: "f5",
    name: "Josh Tan",
    phone: "0921 678 9012",
    avatarColor: colorForName("Josh Tan"),
    payment: {
      gcashNumber: "0921 678 9012",
      gcashName: "Josh Tan",
      hasQr: true,
    },
  },
  {
    id: "f6",
    name: "Nicole Villanueva",
    phone: "0922 789 0123",
    avatarColor: colorForName("Nicole Villanueva"),
    payment: {
      gcashNumber: "0922 789 0123",
      gcashName: "Nicole Villanueva",
      bankName: "Metrobank",
      bankAccountNumber: "4567 8901 23",
      bankAccountName: "Nicole Villanueva",
      hasQr: true,
    },
  },
];

function buildReceipt(
  id: string,
  establishment: string,
  date: string,
  items: { id: string; name: string; price: number; quantity: number }[]
): Receipt {
  const totals = computeReceiptTotals(items, 0.12, 0.1);
  return { id, establishment, date, items, ...totals, vatRate: 0.12, serviceChargeRate: 0.1 };
}

const receiptCafeJuanita = buildReceipt("r1", "Cafe Juanita", daysAgoIso(1), [
  { id: "i1", name: "Aglio Olio", price: 195, quantity: 1 },
  { id: "i2", name: "Pancit Canton", price: 155, quantity: 1 },
  { id: "i3", name: "Iced Tea", price: 75, quantity: 2 },
]);

const receiptMangInasal = buildReceipt("r2", "Mang Inasal", daysAgoIso(4), [
  { id: "i4", name: "Chicken Inasal (Paa)", price: 129, quantity: 3 },
  { id: "i5", name: "Extra Rice", price: 20, quantity: 3 },
  { id: "i6", name: "Halo-Halo", price: 89, quantity: 2 },
]);

const receiptPotatoCorner = buildReceipt("r3", "Potato Corner", daysAgoIso(7), [
  { id: "i7", name: "Large Cheese Fries", price: 110, quantity: 2 },
  { id: "i8", name: "Iced Milk Tea", price: 89, quantity: 2 },
]);

const receiptJollibee = buildReceipt("r4", "Jollibee", daysAgoIso(12), [
  { id: "i9", name: "Chickenjoy 2pc", price: 199, quantity: 4 },
  { id: "i10", name: "Peach Mango Pie", price: 39, quantity: 4 },
  { id: "i11", name: "Coke Float", price: 65, quantity: 4 },
]);

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function member(id: string, name: string, isGuest: boolean, isCurrentUser: boolean, status: "paid" | "pending"): SplitMember {
  return {
    id,
    name,
    avatarColor: isCurrentUser ? "#192F4D" : colorForName(name),
    isGuest,
    isCurrentUser,
    status,
    paidAt: status === "paid" ? daysAgoIso(0) : undefined,
  };
}

function evenAssignments(receipt: Receipt): ItemAssignment[] {
  return receipt.items.map((i) => ({ itemId: i.id, memberIds: [] }));
}

export const mockSplits: Split[] = [
  {
    id: "s1",
    receipt: receiptCafeJuanita,
    method: "item",
    members: [
      member(CURRENT_USER_ID, "You", false, true, "paid"),
      member("f1", "Miguel Santos", false, false, "pending"),
      member("f2", "Andrea Cruz", false, false, "pending"),
    ],
    assignments: [
      { itemId: "i1", memberIds: [CURRENT_USER_ID] },
      { itemId: "i2", memberIds: ["f1"] },
      { itemId: "i3", memberIds: [CURRENT_USER_ID, "f1", "f2"] },
    ],
    createdAt: daysAgoIso(1),
    payeeId: CURRENT_USER_ID,
  },
  {
    id: "s2",
    receipt: receiptMangInasal,
    method: "even",
    members: [
      member(CURRENT_USER_ID, "You", false, true, "pending"),
      member("f3", "Paolo Reyes", false, false, "paid"),
      member("f4", "Bea Fernandez", false, false, "paid"),
    ],
    assignments: evenAssignments(receiptMangInasal),
    createdAt: daysAgoIso(4),
    payeeId: "f3",
  },
  {
    id: "s3",
    receipt: receiptPotatoCorner,
    method: "even",
    members: [
      member(CURRENT_USER_ID, "You", false, true, "paid"),
      member("f5", "Josh Tan", false, false, "paid"),
    ],
    assignments: evenAssignments(receiptPotatoCorner),
    createdAt: daysAgoIso(7),
    payeeId: "f5",
  },
  {
    id: "s4",
    receipt: receiptJollibee,
    method: "item",
    members: [
      member(CURRENT_USER_ID, "You", false, true, "pending"),
      member("f1", "Miguel Santos", false, false, "paid"),
      member("f6", "Nicole Villanueva", false, false, "paid"),
      member("guest1", "Kevin (Guest)", true, false, "pending"),
    ],
    assignments: [
      { itemId: "i9", memberIds: [CURRENT_USER_ID, "f1", "f6", "guest1"] },
      { itemId: "i10", memberIds: [CURRENT_USER_ID, "f1", "f6", "guest1"] },
      { itemId: "i11", memberIds: [CURRENT_USER_ID, "f1", "f6", "guest1"] },
    ],
    createdAt: daysAgoIso(12),
    payeeId: CURRENT_USER_ID,
  },
];

export const receiptTemplates: Receipt[] = [receiptCafeJuanita, receiptMangInasal, receiptPotatoCorner, receiptJollibee];

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
