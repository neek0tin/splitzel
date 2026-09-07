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
  payment: PaymentInfo;
}

export interface Friend {
  id: string;
  name: string;
  phone: string;
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
  receipt: Receipt;
  method: SplitMethod;
  members: SplitMember[];
  assignments: ItemAssignment[];
  createdAt: string;
  /** null means the current user (split owner) is the payee; otherwise a friend's id */
  payeeFriendId: string | null;
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
