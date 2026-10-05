/**
 * AgroHeal Cooperative — Dual-Mode Cutover & ₦15,000 Compensation Engine Specification
 *
 * Effective Cutover: Wednesday, October 7th, 2026 at 9:00 AM West Africa Time (WAT)
 * Strategic UI Countdown Target: Wednesday, October 7th, 2026 at 8:45 AM WAT
 */

// ── 1. CUTOVER TIMESTAMP CONSTANTS ──
export const CUTOVER_TIME_WAT = "2026-10-07T09:00:00+01:00";
export const CUTOVER_TIMESTAMP_MS = new Date(CUTOVER_TIME_WAT).getTime(); // 2026-10-07T08:00:00.000Z

export const COUNTDOWN_TARGET_WAT = "2026-10-07T08:45:00+01:00";
export const COUNTDOWN_TARGET_TIMESTAMP_MS = new Date(COUNTDOWN_TARGET_WAT).getTime(); // 2026-10-07T07:45:00.000Z

/**
 * Checks whether a given transaction/event date falls strictly at or after the 9:00 AM WAT cutover.
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
export interface MatrixLevelSpec {
  level: number;
  positions: number;
  displayPercentageOfRewardPool: number; // For UI display only (% of ₦1,750)
  displayApproxRate: number; // For UI display only (e.g. ₦235.43)
  displayApproxLevelTotal: number; // For UI display only (e.g. ₦1,177)
  normalizedWeight: number; // Exact weight summing to 1.0
  exactRate: number; // Underlying full-precision commission rate (sum = ₦1,350)
}

// Stated descending percentages of the ₦1,750 pool
const RAW_PERCENTAGES = [
  0.134674, // L1
  0.126517, // L2
  0.118361, // L3
  0.110204, // L4
  0.102047, // L5
  0.093891, // L6
  0.085734, // L7
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
 * Returns the exact 7-level commission breakdown for a qualifying starter pack or product purchase.
 * If isProduct is true, uses 15% of the product purchase amount as the pool.
 */
export const calculateNetworkCommissions = (
  poolAmount: number = NEW_NETWORK_COMMISSION_POOL
): { level: number; amount: number; rate: number }[] => {
  return MATRIX_5X7_LEVELS.map((spec) => ({
    level: spec.level,
    amount: spec.normalizedWeight * poolAmount,
    rate: spec.normalizedWeight * poolAmount,
  }));
};

/**
 * Returns the 15% retail product commission distribution across 7 upline levels.
 */
export const calculateProductNetworkCommissions = (
  productTotal: number
): { level: number; amount: number }[] => {
  const pool = Number(productTotal || 0) * 0.15; // 15% of product amount
  return MATRIX_5X7_LEVELS.map((spec) => ({
    level: spec.level,
    amount: spec.normalizedWeight * pool,
  }));
};

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
