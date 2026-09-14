export interface PaymentInfo {
  gcashNumber?: string;
  gcashName?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  /** Storage path of the uploaded GCash QR, if any. Resolve with gcashQrUrl(). */
  gcashQrPath?: string;
}

export interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarColor: string;
  friendCode: string;
  payment: PaymentInfo;
  isPremium: boolean;
  premiumUntil?: string;
}

/** A real, connected Splitzel account — sourced from their own profile, not typed in by you. */
export interface Friend {
  id: string;
  name: string;
  avatarColor: string;
  payment: PaymentInfo;
}

export interface ReceiptItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Receipt {
  id: string;
  establishment: string;
  date: string;
  items: ReceiptItem[];
  subtotal: number;
  vatRate: number;
  serviceChargeRate: number;
  vat: number;
  serviceCharge: number;
  total: number;
}

export type SplitMethod = "item" | "even";

export interface SplitPayment {
  id: string;
  amount: number;
  createdAt: string;
}

export interface SplitMember {
  id: string;
  /** The underlying account's user id, for "me"/friend members — lets the
   *  same person be grouped across different splits. Undefined for guests. */
  userId?: string;
  name: string;
  avatarColor: string;
  isGuest: boolean;
  isCurrentUser: boolean;
  status: "paid" | "pending";
  paidAt?: string;
  /** Sum of `payments` — logged separately from `status`, which only flips to
   *  "paid" once payments cover the member's full share. */
  amountPaid: number;
  payments: SplitPayment[];
}

export interface ItemAssignment {
  itemId: string;
  memberIds: string[];
}

export interface Split {
  id: string;
  ownerId: string;
  receipt: Receipt;
  method: SplitMethod;
  members: SplitMember[];
  assignments: ItemAssignment[];
  createdAt: string;
  /** null means the split's owner is the payee; otherwise a connected friend's user id */
  payeeUserId: string | null;
}

export interface ShareBreakdown {
  memberId: string;
  subtotal: number;
  taxServiceCharge: number;
  lateFee: number;
  convenienceFee: number;
  total: number;
}

export interface DraftScan {
  receipt: Receipt | null;
  method: SplitMethod | null;
  members: SplitMember[];
  assignments: ItemAssignment[];
}

export type NotificationType = "split_added" | "member_paid" | "marked_received" | "nudge" | "split_edited";

export interface AppNotification {
  id: string;
  type: NotificationType;
  splitId: string | null;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}
