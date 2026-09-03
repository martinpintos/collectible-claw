import { BPS_TOTAL } from "./odds";
import type { Rng } from "./rng";
import type { CatalogItem, RarityTier, TierId } from "./types";

export class EmptyTierError extends Error {
  constructor(public readonly tier: TierId) {
    super(`No catalog items available for tier "${tier}"`);
    this.name = "EmptyTierError";
  }
}

/** Weighted tier selection. `roll` is a number in [0, 1). */
export function pickTier(tiers: RarityTier[], roll: number): TierId {
  const target = Math.min(Math.max(roll, 0), 0.999999) * BPS_TOTAL;
  let cursor = 0;
  for (const tier of tiers) {
    cursor += tier.oddsBps;
    if (target < cursor) return tier.id;
  }
  return tiers[tiers.length - 1].id;
}

/**
 * Draw `quantity` items: weighted tier roll, then a uniform pick inside that tier.
 * Pure and deterministic given `rng`, so it is unit-tested with a seeded generator
 * and driven by a CSPRNG inside the Server Action.
 */
export function drawItems(
  tiers: RarityTier[],
  catalog: CatalogItem[],
  quantity: number,
  rng: Rng,
): CatalogItem[] {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new RangeError("quantity must be a positive integer");
  }
  const buckets = new Map<TierId, CatalogItem[]>();
  for (const item of catalog) {
    const bucket = buckets.get(item.tier) ?? [];
    bucket.push(item);
    buckets.set(item.tier, bucket);
  }
  for (const tier of tiers) {
    if (!buckets.get(tier.id)?.length) throw new EmptyTierError(tier.id);
  }

  const drawn: CatalogItem[] = [];
  for (let i = 0; i < quantity; i++) {
    const tier = pickTier(tiers, rng());
    const bucket = buckets.get(tier)!;
    drawn.push(bucket[Math.floor(rng() * bucket.length)]);
  }
  return drawn;
}
