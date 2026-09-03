import { TIER_ORDER, type CatalogEntry, type RarityTier, type TierId } from "./types";

export const BPS_TOTAL = 10_000;

/**
 * Convert human percentages (e.g. from the design: 0.72 / 0.19 / 3.48 / 21.08 / 75.05)
 * into basis points that sum to exactly 10 000. Rounding drift is absorbed by
 * the base tier so the visible odds match the design to two decimals.
 */
export function percentagesToBps(percentages: Record<TierId, number>): Record<TierId, number> {
  const raw = Object.fromEntries(
    TIER_ORDER.map((id) => [id, Math.max(0, Math.round(percentages[id] * 100))]),
  ) as Record<TierId, number>;
  const withoutBase = TIER_ORDER.filter((id) => id !== "base").reduce((sum, id) => sum + raw[id], 0);
  raw.base = BPS_TOTAL - withoutBase;
  if (raw.base < 0) {
    throw new Error("Tier percentages exceed 100%");
  }
  return raw;
}

export function assertOdds(tiers: RarityTier[]): void {
  const ids = tiers.map((t) => t.id);
  for (const id of TIER_ORDER) {
    if (!ids.includes(id)) throw new Error(`Missing tier ${id}`);
  }
  if (ids.length !== TIER_ORDER.length) throw new Error("Duplicate tiers");

  const total = tiers.reduce((sum, t) => sum + t.oddsBps, 0);
  if (total !== BPS_TOTAL) throw new Error(`Odds sum to ${total} bps, expected ${BPS_TOTAL}`);

  const byValue = [...tiers].sort((a, b) => a.minValue - b.minValue);
  for (let i = 0; i < byValue.length; i++) {
    const tier = byValue[i];
    const next = byValue[i + 1];
    if (tier.maxValue !== null && tier.maxValue < tier.minValue) {
      throw new Error(`Tier ${tier.id} has an inverted range`);
    }
    if (next) {
      if (tier.maxValue === null) throw new Error(`Tier ${tier.id} is unbounded but not the top tier`);
      if (next.minValue !== tier.maxValue + 1) {
        throw new Error(`Gap or overlap between ${tier.id} and ${next.id}`);
      }
    } else if (tier.maxValue !== null) {
      throw new Error(`Top tier ${tier.id} must be unbounded`);
    }
  }
}

export function tierForValue(tiers: RarityTier[], value: number): TierId | null {
  const match = tiers.find(
    (t) => value >= t.minValue && (t.maxValue === null || value <= t.maxValue),
  );
  return match?.id ?? null;
}

export function tiersInOrder(tiers: RarityTier[]): RarityTier[] {
  return TIER_ORDER.map((id) => tiers.find((t) => t.id === id)!).filter(Boolean);
}

export function bpsToPercent(bps: number): number {
  return bps / 100;
}

/** "0.72%" – always two decimals, like the odds grid in the design. */
export function formatOdds(bps: number): string {
  return `${bpsToPercent(bps).toFixed(2)}%`;
}

/** Probability of the pull landing in `tierId` or better (used for rarity styling). */
export function cumulativeBps(tiers: RarityTier[], tierId: TierId): number {
  const idx = TIER_ORDER.indexOf(tierId);
  return TIER_ORDER.slice(0, idx + 1).reduce(
    (sum, id) => sum + (tiers.find((t) => t.id === id)?.oddsBps ?? 0),
    0,
  );
}

/**
 * Expected market value of a single pull: Σ p(tier) × mean(value of items in tier).
 * Tiers without items contribute nothing (data tests guarantee every tier is stocked).
 */
export function averageValue(tiers: RarityTier[], items: CatalogEntry[]): number {
  let expected = 0;
  for (const tier of tiers) {
    const bucket = items.filter((item) => tierForValue(tiers, item.marketValue) === tier.id);
    if (bucket.length === 0) continue;
    const mean = bucket.reduce((sum, item) => sum + item.marketValue, 0) / bucket.length;
    expected += (tier.oddsBps / BPS_TOTAL) * mean;
  }
  return Math.round(expected);
}
