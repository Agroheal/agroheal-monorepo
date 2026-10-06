export interface MemberSlotSummary {
  category: string;
  slots: number;
  status: string;
}

export interface Member {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  member_id: string;
  referral_code: string;
  referred_by: string;
  raw_referred_by?: string;
  role?: string;
  created_at: string;
  has_green_card: boolean;
  green_card_expires_at?: string;
  total_slots: number;
  slots_by_program: MemberSlotSummary[];
  country?: string;
  state?: string;
  lga?: string;
  advance_debt_balance?: number;
  is_suspended?: boolean;
}

export interface PaymentLog {
  id: string;
  user_email: string;
  amount: number;
  project_category: string;
  created_at: string;
  slots: number;
  status: string;
  type: "slot_subscription" | "other_payment" | "transaction";
  reference?: string;
}

declare global {
  const __APP_BUILD_TIME__: string;
}
