import { useMemo } from "react";
import { useAdminTierFilter, type AdminTier } from "@/context/AdminTierContext";

export interface TierPartitions<T> {
  live: T[];
  legacy: T[];
  all: T[];
}

export interface TierCounts {
  live: number;
  legacy: number;
  all: number;
  active: number;
}

export interface TierPartitionResult<T, K = Record<string, number>> {
  active: T[];
  partitions: TierPartitions<T>;
  counts: TierCounts;
  aggregates?: {
    live: K;
    legacy: K;
    all: K;
    active: K;
  };
  tier: AdminTier;
  isModern: boolean;
  isLegacy: boolean;
  isBoth: boolean;
}

export interface UseTierPartitionedOptions<T, K> {
  isLegacyFn?: (item: T) => boolean;
  computeAggregates?: (items: T[]) => K;
}

/**
 * Canonical check for whether a record is legacy.
 * Honors explicit `is_legacy` boolean or fallback.
 */
export function defaultIsLegacy<T>(item: T): boolean {
  if (!item || typeof item !== "object") return false;
  return Boolean((item as any).is_legacy);
}

/**
 * Pure helper function to partition any collection by tier.
 */
export function partitionCollectionByTier<T>(
  items: T[],
  isLegacyFn: (item: T) => boolean = defaultIsLegacy
): TierPartitions<T> {
  const live: T[] = [];
  const legacy: T[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (isLegacyFn(item)) {
      legacy.push(item);
    } else {
      live.push(item);
    }
  }

  return {
    live,
    legacy,
    all: items,
  };
}

/**
 * Pure helper function to filter items by a given tier.
 */
export function filterCollectionByTier<T>(
  items: T[],
  tier: AdminTier,
  isLegacyFn: (item: T) => boolean = defaultIsLegacy
): T[] {
  if (tier === "live") {
    return items.filter((item) => !isLegacyFn(item));
  }
  if (tier === "legacy") {
    return items.filter((item) => isLegacyFn(item));
  }
  return items;
}

/**
 * Decoupled Central Switch & Aggregate Root Hook.
 * Automatically slices any collection according to the active global AdminTier switch
 * and pre-computes partitioned counts and domain aggregates.
 */
export function useTierPartitioned<T, K = Record<string, number>>(
  items: T[] = [],
  options?: UseTierPartitionedOptions<T, K>
): TierPartitionResult<T, K> {
  const { tier, isModern, isLegacy, isBoth } = useAdminTierFilter();
  const isLegacyFn = options?.isLegacyFn || defaultIsLegacy;
  const computeAggregates = options?.computeAggregates;

  // 1. Partition the raw collection once
  const partitions = useMemo(() => {
    return partitionCollectionByTier(items, isLegacyFn);
  }, [items, isLegacyFn]);

  // 2. Select the active slice with zero UI-level boilerplate
  const active = useMemo(() => {
    if (tier === "live") return partitions.live;
    if (tier === "legacy") return partitions.legacy;
    return partitions.all;
  }, [tier, partitions]);

  // 3. Pre-calculate counts across all slices
  const counts = useMemo<TierCounts>(() => {
    return {
      live: partitions.live.length,
      legacy: partitions.legacy.length,
      all: partitions.all.length,
      active: active.length,
    };
  }, [partitions, active]);

  // 4. Pre-calculate optional domain aggregates across all slices
  const aggregates = useMemo(() => {
    if (!computeAggregates) return undefined;
    return {
      live: computeAggregates(partitions.live),
      legacy: computeAggregates(partitions.legacy),
      all: computeAggregates(partitions.all),
      active: computeAggregates(active),
    };
  }, [computeAggregates, partitions, active]);

  return {
    active,
    partitions,
    counts,
    aggregates,
    tier,
    isModern,
    isLegacy,
    isBoth,
  };
}
