export interface PaymentInfo {
  gcashNumber?: string;
  gcashName?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountName?: string;
  hasQr?: boolean;
}

export interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  avatarColor: string;
  friendCode: string;
  payment: PaymentInfo;
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

export interface SplitMember {
  id: string;
  name: string;
  avatarColor: string;
  isGuest: boolean;
  isCurrentUser: boolean;
  status: "paid" | "pending";
  paidAt?: string;
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

export type NotificationType = "split_added" | "member_paid" | "marked_received" | "nudge";

export interface AppNotification {
  id: string;
  type: NotificationType;
  splitId: string | null;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}
