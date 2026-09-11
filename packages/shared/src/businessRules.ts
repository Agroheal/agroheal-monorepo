/**
 * AgroHeal Cooperative — Official Central Source of Truth for Business Rules & Pricing
 *
 * This file standardizes all monetary values, fee structures, commission percentages,
 * and biological production benchmarks across the monorepo (apps/web, apps/admin, server).
 */

// ── 1. MEMBERSHIP & ID PASSES ──
export const GREEN_CARD_FEE = 2000; // One-time ₦2,000 Green Card lifetime pass & organic academy access

// ── 2. COMMERCIAL FARM SLOTS (BIOLOGICAL PRODUCTION) ──
export const BASE_SLOT_PRICE = 5000; // ₦5,000 per slot (biological asset allocation: 2 fruiting bags)
export const CLUSTER_SETUP_FEE = 5000; // ₦5,000 one-time cluster setup & onboarding fee on first slot
export const STARTER_SLOT_TOTAL = BASE_SLOT_PRICE + CLUSTER_SETUP_FEE; // ₦10,000 (₦5,000 + ₦5,000)
export const SUBSEQUENT_SLOT_PRICE = BASE_SLOT_PRICE; // ₦5,000 for each additional slot

export const BAGS_PER_SLOT_CYCLE_1 = 2; // Starter oyster mushroom fruiting bags
export const BAGS_PER_SLOT_CYCLE_2_PLUS = 4; // Capacity doubling from Cycle 1 reinvestment
export const CYCLE_1_REINVESTMENT_PERCENT = 90; // 90% harvest ploughed back into capacity doubling
export const PROJECTED_SURPLUS_DIVIDENDS_PERCENT = 40; // Up to 40% net harvest surplus dividends from Cycle 2 onward
export const CYCLE_DURATION_MONTHS = 3; // 3 months per harvest flush cycle

// ── 3. DIRECT SPONSOR & RETAIL COMMISSIONS ──
export const SLOT_DIRECT_SPONSOR_PERCENT = 10; // 10% direct sponsor referral bonus on farm slots (₦500 per ₦5,000 slot)
export const RETAIL_DIRECT_MARGIN_PERCENT = 12; // Up to 12% direct margin on retail marketplace sales

// ── 4. MULTILEVEL MATRIX DISTRIBUTION (5×7 SPILLOVER) ──
export const MATRIX_DIMENSION = 5; // 5-wide forced matrix
export const MATRIX_MAX_DEPTH = 7; // 7 levels deep
export const DIRECTS_PER_LEVEL_UNLOCK = 5; // Sponsor 5 active direct partners to unlock each tier
export const TOTAL_DIRECTS_FOR_ALL_LEVELS = 35; // 5 * 7 = 35 directs for full 7-level depth
export const MONTHLY_PQV_REQUIREMENT = 5000; // ₦5,000 rolling 30-day Personal Qualifying Volume
export const TOTAL_POTENTIAL_MATRIX_COMMISSIONS = 12212500; // ₦12,212,500 across 7 matrix tiers

// Strict 40% product commission ceiling on retail sales (₦2,000 maximum payout on a ₦5,000 sale)
export const PRODUCT_COMMISSION_CEILING_PERCENT = 40;
export const PRODUCT_MULTILEVEL_PERCENT_SUBTOTAL = 21.5;

export interface MatrixCommissionTier {
  level: number;
  percentage: number;
  amount: number;
  maxMembers: number;
  potential: number;
  requiredDirects: number;
}

export const MATRIX_COMMISSIONS_TIERS: readonly MatrixCommissionTier[] = [
  { level: 1, percentage: 5.0, amount: 250, maxMembers: 5, potential: 1250, requiredDirects: 5 },
  { level: 2, percentage: 3.5, amount: 175, maxMembers: 25, potential: 4375, requiredDirects: 10 },
  { level: 3, percentage: 3.0, amount: 150, maxMembers: 125, potential: 18750, requiredDirects: 15 },
  { level: 4, percentage: 2.5, amount: 125, maxMembers: 625, potential: 78125, requiredDirects: 20 },
  { level: 5, percentage: 2.5, amount: 125, maxMembers: 3125, potential: 390625, requiredDirects: 25 },
  { level: 6, percentage: 2.5, amount: 125, maxMembers: 15625, potential: 1953125, requiredDirects: 30 },
  { level: 7, percentage: 2.5, amount: 125, maxMembers: 78125, potential: 9765625, requiredDirects: 35 },
] as const;

// ── 5. HELPER FUNCTIONS ──
export const getUnlockedMatrixLevel = (directCount: number): number => {
  return Math.min(MATRIX_MAX_DEPTH, Math.floor(Math.max(0, directCount) / DIRECTS_PER_LEVEL_UNLOCK));
};

export const calculateSlotSubtotal = (
  slotQuantity: number,
  hasPriorSlots: boolean
): {
  subtotal: number;
  isFirstSlotPurchase: boolean;
  baseCost: number;
  setupFee: number;
} => {
  const isFirst = !hasPriorSlots;
  const qty = Math.max(1, slotQuantity);
  const setupFee = isFirst ? CLUSTER_SETUP_FEE : 0;
  const baseCost = qty * BASE_SLOT_PRICE;
  return {
    subtotal: baseCost + setupFee,
    isFirstSlotPurchase: isFirst,
    baseCost,
    setupFee,
  };
};

export const formatNaira = (amount: number): string => {
  return `₦${Number(amount || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
};
