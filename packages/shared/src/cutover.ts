/**
 * AgroHeal Cooperative — Dual-Mode Cutover & ₦15,000 Compensation Engine Specification
 *
 * Effective Cutover: Friday, October 9th, 2026 at 11:59:59 PM West Africa Time (WAT)
 * Strategic UI Countdown Target: Friday, October 9th, 2026 at 11:59:59 PM WAT
 */

// ── 1. CUTOVER TIMESTAMP CONSTANTS ──
export const CUTOVER_TIME_WAT = "2026-10-09T23:59:59+01:00";
export const CUTOVER_TIMESTAMP_MS = new Date(CUTOVER_TIME_WAT).getTime(); // 2026-10-09T22:59:59.000Z

export const COUNTDOWN_TARGET_WAT = "2026-10-09T23:59:59+01:00";
export const COUNTDOWN_TARGET_TIMESTAMP_MS = new Date(COUNTDOWN_TARGET_WAT).getTime(); // 2026-10-09T22:59:59.000Z

/**
 * Checks whether a given transaction/event date falls strictly at or after the Friday 11:59:59 PM WAT cutover.
 * If no date is supplied, evaluates against current local/system time.
 */
export const isPostCutover = (date?: Date | string | number | null): boolean => {
  if (!date) {
    return Date.now() >= CUTOVER_TIMESTAMP_MS;
  }
  const time = new Date(date).getTime();
  return !isNaN(time) && time >= CUTOVER_TIMESTAMP_MS;
};

// ── 2. NEW PRICING CONSTANTS (EFFECTIVE OCT 7, 2026, 9:00 AM WAT) ──
export const NEW_GREEN_CARD_FEE = 2000;
export const NEW_FARM_SLOT_PRICE = 5000;
export const NEW_STARTER_PACK_PRICE = 8000;
export const NEW_TOTAL_ENTRY_FEE = NEW_GREEN_CARD_FEE + NEW_FARM_SLOT_PRICE + NEW_STARTER_PACK_PRICE; // ₦15,000

// Direct Sponsor Commissions on ₦15,000 Entry
export const NEW_DIRECT_SPONSOR_GC = 1000;
export const NEW_DIRECT_SPONSOR_SLOT = 500;
export const NEW_DIRECT_SPONSOR_STARTER_PACK = 1000;
export const NEW_TOTAL_DIRECT_SPONSOR_BONUS =
  NEW_DIRECT_SPONSOR_GC + NEW_DIRECT_SPONSOR_SLOT + NEW_DIRECT_SPONSOR_STARTER_PACK; // ₦2,500

// Production & Farm Group Allocations
export const NEW_GROUP_FARM_PRODUCTION_FUND = 3500; // Credited directly to Group Farm Wallet
export const NEW_MUSHROOM_POWER_PRODUCTION_FUND = 4500; // Physical manufacturing fund

// Company Revenue Allocations
export const NEW_COMPANY_REV_GC = 1000;
export const NEW_COMPANY_REV_SLOT = 1000;
export const NEW_COMPANY_REV_STARTER_PACK = 250;
export const NEW_TOTAL_COMPANY_REVENUE =
  NEW_COMPANY_REV_GC + NEW_COMPANY_REV_SLOT + NEW_COMPANY_REV_STARTER_PACK; // ₦2,250

// Reserve & Pool Allocations from ₦8,000 Starter Pack
export const NEW_CORE_PARTNER_POOL = 500;
export const NEW_STARTER_PACK_REWARD_POOL = 1750; // Total MLM + Leadership + Car
export const NEW_NETWORK_COMMISSION_POOL = 1350; // Distributed over 7 levels
export const NEW_LEADERSHIP_POOL = 200; // Dedicated leadership reserve account
export const NEW_CAR_AWARD_POOL = 200; // Dedicated quarterly car award reserve account

// ── 3. 5×7 MLM NETWORK DESCENDING WEIGHT ENGINE ──
export const GENERATION_INDIRECT_LABELS: Record<number, string> = {
  1: "1st Generation Indirect",
  2: "2nd Generation Indirect",
  3: "3rd Generation Indirect",
  4: "4th Generation Indirect",
  5: "5th Generation Indirect",
  6: "6th Generation Indirect",
  7: "7th Generation Indirect",
};

export function getGenerationLabel(level: number): string {
  return GENERATION_INDIRECT_LABELS[level] || `Level ${level} Generation Indirect`;
}

export interface MatrixLevelSpec {
  level: number;
  label: string;
  positions: number;
  displayPercentageOfRewardPool: number; // For UI display only (% of ₦1,750)
  displayApproxRate: number; // For UI display only (e.g. ₦235.43)
  displayApproxLevelTotal: number; // For UI display only (e.g. ₦1,177)
  normalizedWeight: number; // Exact weight summing to 1.0
  exactRate: number; // Underlying full-precision commission rate (sum = ₦1,350)
}

// Stated descending percentages of the ₦1,750 pool
export const RAW_PERCENTAGES = [
  0.134674, // L1 (1st Generation Indirect)
  0.126517, // L2 (2nd Generation Indirect)
  0.118361, // L3 (3rd Generation Indirect)
  0.110204, // L4 (4th Generation Indirect)
  0.102047, // L5 (5th Generation Indirect)
  0.093891, // L6 (6th Generation Indirect)
  0.085734, // L7 (7th Generation Indirect)
];

const SUM_RAW_PERCENTAGES = RAW_PERCENTAGES.reduce((a, b) => a + b, 0); // 0.771428 (₦1,350 / ₦1,750)
const LEVEL_POSITIONS = [5, 25, 125, 625, 3125, 15625, 78125];

export const MATRIX_5X7_LEVELS: readonly MatrixLevelSpec[] = RAW_PERCENTAGES.map((rawPct, idx) => {
  const level = idx + 1;
  const positions = LEVEL_POSITIONS[idx];
  const normalizedWeight = rawPct / SUM_RAW_PERCENTAGES;
  const exactRate = normalizedWeight * NEW_NETWORK_COMMISSION_POOL;

  const approxRates = [235.43, 221.4, 207.13, 192.86, 178.58, 164.31, 149.53];
  const approxTotals = [1177, 5535, 25892, 120408, 558074, 2567379, 11721535];

  return {
    level,
    label: getGenerationLabel(level),
    positions,
    displayPercentageOfRewardPool: Number((rawPct * 100).toFixed(4)),
    displayApproxRate: approxRates[idx],
    displayApproxLevelTotal: approxTotals[idx],
    normalizedWeight,
    exactRate,
  };
});

export const TOTAL_5X7_POSITIONS = LEVEL_POSITIONS.reduce((a, b) => a + b, 0); // 97,655 positions
export const TOTAL_POTENTIAL_5X7_EARNINGS = 15000000; // ₦15,000,000 EXACTLY

/**
 * Detects whether a product belongs to the Starter Pack tier (one-time onboarding),
 * or whether it is a regular product that uses the 15% PQV commission engine.
 */
export function isStarterPackProduct(product?: { category?: string | null; code?: string | null; sku?: string | null } | null): boolean {
  if (!product) return false;
  const cat = (product.category || "").toUpperCase();
  const code = (product.code || "").toUpperCase();
  const sku = (product.sku || "").toUpperCase();
  return (
    cat === "STARTER_PACK" ||
    code === "SP-MUSH-100G" ||
    sku === "MP-100G"
  );
}

export interface PqvDistributionTier {
  level: number;
  label: string;
  positions: number;
  percentageOfRewardPool: number; // e.g. 13.4674%
  normalizedWeight: number;
  exactRate: number;
  amount: number; // rounded to 2 decimal places for financial display
}

export interface PqvProductCommissionResult {
  orderAmount: number;
  totalRewardPool: number; // 15% of orderAmount
  networkCommissionPool: number; // 77.142857% of totalRewardPool (₦1,350 / ₦1,750)
  leadershipPoolAmount: number; // 11.428571% of totalRewardPool (₦200 / ₦1,750)
  carAwardPoolAmount: number; // 11.428571% of totalRewardPool (₦200 / ₦1,750)
  tiers: PqvDistributionTier[];
}

/**
 * Returns the exact 7-level commission breakdown for a qualifying starter pack or product purchase.
 */
export const calculateNetworkCommissions = (
  poolAmount: number = NEW_NETWORK_COMMISSION_POOL
): { level: number; label: string; amount: number; rate: number }[] => {
  return MATRIX_5X7_LEVELS.map((spec) => ({
    level: spec.level,
    label: spec.label,
    amount: spec.normalizedWeight * poolAmount,
    rate: spec.normalizedWeight * poolAmount,
  }));
};

/**
 * Returns the 15% retail product commission distribution across 7 preceding upline generations.
 * Allocates 77.142857% of the 15% pool across the 7 generations.
 */
export const calculateProductNetworkCommissions = (
  productTotal: number
): { level: number; label: string; amount: number; rate: number }[] => {
  const totalPool = Number(productTotal || 0) * 0.15; // 15% of product amount
  const networkPool = totalPool * (NEW_NETWORK_COMMISSION_POOL / NEW_STARTER_PACK_REWARD_POOL); // 77.142857%
  return MATRIX_5X7_LEVELS.map((spec) => ({
    level: spec.level,
    label: spec.label,
    amount: Math.round(spec.normalizedWeight * networkPool * 100) / 100,
    rate: spec.normalizedWeight * networkPool,
  }));
};

/**
 * Authoritative Post-Cutover PQV Product Commission Calculator.
 * Applies to all retail / general products purchased on the platform (excluding starter packs).
 */
export function calculatePqvProductCommissions(
  orderAmount: number
): PqvProductCommissionResult {
  const base = Math.max(0, Number(orderAmount) || 0);
  const totalRewardPool = base * 0.15; // 15% pool
  const networkCommissionPool = totalRewardPool * (NEW_NETWORK_COMMISSION_POOL / NEW_STARTER_PACK_REWARD_POOL); // 77.142857%
  const leadershipPoolAmount = Math.round(totalRewardPool * (NEW_LEADERSHIP_POOL / NEW_STARTER_PACK_REWARD_POOL) * 100) / 100;
  const carAwardPoolAmount = Math.round(totalRewardPool * (NEW_CAR_AWARD_POOL / NEW_STARTER_PACK_REWARD_POOL) * 100) / 100;

  const tiers: PqvDistributionTier[] = MATRIX_5X7_LEVELS.map((spec, idx) => {
    const rawPct = RAW_PERCENTAGES[idx];
    const exactRate = spec.normalizedWeight * networkCommissionPool;
    return {
      level: spec.level,
      label: spec.label,
      positions: spec.positions,
      percentageOfRewardPool: Number((rawPct * 100).toFixed(4)),
      normalizedWeight: spec.normalizedWeight,
      exactRate,
      amount: Math.round(exactRate * 100) / 100,
    };
  });

  return {
    orderAmount: base,
    totalRewardPool,
    networkCommissionPool,
    leadershipPoolAmount,
    carAwardPoolAmount,
    tiers,
  };
}

// ── 4. ENTRY PRICING SELECTOR (PRE-CUTOVER VS POST-CUTOVER) ──
export interface EntryPricingStructure {
  mode: "PRE_CUTOVER" | "POST_CUTOVER";
  greenCardFee: number;
  farmSlotPrice: number;
  starterPackPrice: number;
  totalEntryFee: number;
  directSponsorReward: number;
  groupFarmAllocation: number;
  networkPool: number;
}

export const getEntryPricing = (date?: Date | string | number | null): EntryPricingStructure => {
  if (isPostCutover(date)) {
    return {
      mode: "POST_CUTOVER",
      greenCardFee: NEW_GREEN_CARD_FEE,
      farmSlotPrice: NEW_FARM_SLOT_PRICE,
      starterPackPrice: NEW_STARTER_PACK_PRICE,
      totalEntryFee: NEW_TOTAL_ENTRY_FEE,
      directSponsorReward: NEW_TOTAL_DIRECT_SPONSOR_BONUS,
      groupFarmAllocation: NEW_GROUP_FARM_PRODUCTION_FUND,
      networkPool: NEW_NETWORK_COMMISSION_POOL,
    };
  }

  // Pre-Cutover standard: ₦2,000 GC + ₦5,000 Slot + ₦5,000 Starter Pack = ₦12,000
  return {
    mode: "PRE_CUTOVER",
    greenCardFee: 2000,
    farmSlotPrice: 5000,
    starterPackPrice: 5000,
    totalEntryFee: 12000,
    directSponsorReward: 1500, // ₦1,000 GC + ₦500 Slot
    groupFarmAllocation: 0,
    networkPool: 2000,
  };
};
