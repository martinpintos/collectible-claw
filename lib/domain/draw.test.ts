import { describe, expect, it } from "vitest";
import { MACHINES } from "@/lib/data/machines";
import { CATALOG } from "@/lib/data/catalog";
import { EmptyTierError, drawItems, pickTier } from "./draw";
import { BPS_TOTAL, tierForValue } from "./odds";
import { mulberry32 } from "./rng";
import type { CatalogItem, Machine } from "./types";

function catalogFor(machine: Machine): CatalogItem[] {
  return CATALOG.flatMap((entry) => {
    const tier = tierForValue(machine.tiers, entry.marketValue);
    return tier ? [{ ...entry, machineId: machine.id, tier, imageSrc: null }] : [];
  });
}

const gold = MACHINES.find((m) => m.slug === "pokemon-gold-claw")!;
const goldCatalog = catalogFor(gold);

describe("pickTier", () => {
  it("walks the cumulative odds", () => {
    expect(pickTier(gold.tiers, 0)).toBe("ultra");
    expect(pickTier(gold.tiers, 71 / BPS_TOTAL)).toBe("ultra");
    expect(pickTier(gold.tiers, 72 / BPS_TOTAL)).toBe("rare");
    expect(pickTier(gold.tiers, 0.5)).toBe("base");
    expect(pickTier(gold.tiers, 0.999999)).toBe("base");
    expect(pickTier(gold.tiers, 1)).toBe("base");
  });
});

describe("drawItems", () => {
  it("returns exactly `quantity` items, each inside its tier range", () => {
    const items = drawItems(gold.tiers, goldCatalog, 7, mulberry32(7));
    expect(items).toHaveLength(7);
    for (const item of items) {
      expect(tierForValue(gold.tiers, item.marketValue)).toBe(item.tier);
    }
  });

  it("is deterministic for a given seed", () => {
    const a = drawItems(gold.tiers, goldCatalog, 5, mulberry32(42)).map((i) => i.id);
    const b = drawItems(gold.tiers, goldCatalog, 5, mulberry32(42)).map((i) => i.id);
    expect(a).toEqual(b);
  });

  it("matches the published odds over many draws", () => {
    const rng = mulberry32(2024);
    const draws = drawItems(gold.tiers, goldCatalog, 20_000, rng);
    for (const tier of gold.tiers) {
      const share = draws.filter((d) => d.tier === tier.id).length / draws.length;
      const expected = tier.oddsBps / BPS_TOTAL;
      expect(Math.abs(share - expected), tier.id).toBeLessThan(0.015);
    }
  });

  it("throws when a tier has no stock", () => {
    const noUltra = goldCatalog.filter((i) => i.tier !== "ultra");
    expect(() => drawItems(gold.tiers, noUltra, 1, mulberry32(1))).toThrow(EmptyTierError);
  });

  it("rejects non-positive quantities", () => {
    expect(() => drawItems(gold.tiers, goldCatalog, 0, mulberry32(1))).toThrow(RangeError);
    expect(() => drawItems(gold.tiers, goldCatalog, 1.5, mulberry32(1))).toThrow(RangeError);
  });
});
