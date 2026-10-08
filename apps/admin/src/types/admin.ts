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
  sponsor_id?: string;
  sponsor_name?: string;
  role?: string;
  created_at: string;
  has_green_card: boolean;
  green_card_expires_at?: string;
  has_purchased_starter_pack?: boolean;
  is_wealth_creation_active?: boolean;
  placement_parent_id?: string | null;
  placement_parent_name?: string | null;
  matrix_depth?: number | null;
  matrix_position?: number | null;
  placement_status?: string | null;
  total_slots: number;
  slots_by_program: MemberSlotSummary[];
  country?: string;
  state?: string;
  lga?: string;
  is_legacy?: boolean;
  advance_debt_balance?: number;
  is_suspended?: boolean;
  can_manage_system_configs?: boolean;
  custom_permissions?: Record<string, boolean>;
}

export interface PaymentLog {
  id: string;
  user_id?: string;
  user_name?: string;
  user_email: string;
  amount: number;
  project_category: string;
  created_at: string;
  slots: number;
  status: string;
  type: "slot_subscription" | "other_payment" | "transaction";
  reference?: string;
  is_legacy?: boolean;
}

export interface FulfillmentOrder {
  id: string;
  userId: string;
  transactionId?: number | string;
  productCode: string;
  productName: string;
  quantity: number;
  totalPrice: number;
  status: string;
  notes?: string;
  createdAt: string;
  is_legacy?: boolean;
  orderOrigin?: "order" | "transaction" | "legacy_checkout";
  buyer: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    memberId: string;
    state: string;
    lga: string;
    country: string;
  };
  transactionRef?: string;
}

export interface StateFulfillmentGroup {
  state: string;
  count: number;
  totalQuantity: number;
  pendingCount: number;
  shippedCount: number;
  deliveredCount: number;
  items: FulfillmentOrder[];
}

declare global {
  const __APP_BUILD_TIME__: string;
}

