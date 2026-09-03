import { describe, expect, it } from "vitest";
import { MACHINES } from "@/lib/data/machines";
import { CATALOG } from "@/lib/data/catalog";
import {
  BPS_TOTAL,
  assertOdds,
  averageValue,
  cumulativeBps,
  formatOdds,
  percentagesToBps,
  tierForValue,
  tiersInOrder,
} from "./odds";
import { TIER_ORDER } from "./types";

describe("percentagesToBps", () => {
  it("absorbs rounding drift into the base tier so the total is exactly 10 000", () => {
    const bps = percentagesToBps({ ultra: 0.72, rare: 0.19, uncommon: 3.48, common: 21.08, base: 75.05 });
    expect(bps.ultra).toBe(72);
    expect(bps.rare).toBe(19);
    expect(bps.uncommon).toBe(348);
    expect(bps.common).toBe(2108);
    expect(Object.values(bps).reduce((a, b) => a + b, 0)).toBe(BPS_TOTAL);
  });

  it("throws when the non-base tiers alone exceed 100%", () => {
    expect(() =>
      percentagesToBps({ ultra: 60, rare: 50, uncommon: 0, common: 0, base: 0 }),
    ).toThrow();
  });
});

describe("machine odds tables", () => {
  it.each(MACHINES.map((m) => [m.slug, m] as const))("%s is internally consistent", (_, machine) => {
    expect(() => assertOdds(machine.tiers)).not.toThrow();
    expect(machine.tiers.reduce((sum, t) => sum + t.oddsBps, 0)).toBe(BPS_TOTAL);
    expect(tiersInOrder(machine.tiers).map((t) => t.id)).toEqual(TIER_ORDER);
  });

  it.each(MACHINES.map((m) => [m.slug, m] as const))("%s has stock in every tier", (_, machine) => {
    for (const tier of machine.tiers) {
      const stocked = CATALOG.filter((c) => tierForValue(machine.tiers, c.marketValue) === tier.id);
      expect(stocked.length, `${machine.slug}/${tier.id}`).toBeGreaterThan(0);
    }
  });
});

describe("assertOdds", () => {
  const gold = MACHINES.find((m) => m.slug === "pokemon-gold-claw")!;

  it("rejects gaps between ranges", () => {
    const broken = gold.tiers.map((t) => (t.id === "common" ? { ...t, minValue: 600 } : t));
    expect(() => assertOdds(broken)).toThrow(/Gap or overlap/);
  });

  it("rejects totals that are not 10 000 bps", () => {
    const broken = gold.tiers.map((t) => (t.id === "base" ? { ...t, oddsBps: t.oddsBps - 1 } : t));
    expect(() => assertOdds(broken)).toThrow(/Odds sum/);
  });
});

describe("tierForValue", () => {
  const gold = MACHINES.find((m) => m.slug === "pokemon-gold-claw")!;
  it("maps boundaries inclusively", () => {
    expect(tierForValue(gold.tiers, 249)).toBeNull();
    expect(tierForValue(gold.tiers, 250)).toBe("base");
    expect(tierForValue(gold.tiers, 500)).toBe("base");
    expect(tierForValue(gold.tiers, 501)).toBe("common");
    expect(tierForValue(gold.tiers, 1500)).toBe("common");
    expect(tierForValue(gold.tiers, 1501)).toBe("uncommon");
    expect(tierForValue(gold.tiers, 8000)).toBe("rare");
    expect(tierForValue(gold.tiers, 8001)).toBe("ultra");
    expect(tierForValue(gold.tiers, 1_000_000)).toBe("ultra");
  });
});

describe("helpers", () => {
  it("formats odds with two decimals", () => {
    expect(formatOdds(72)).toBe("0.72%");
    expect(formatOdds(7505)).toBe("75.05%");
  });

  it("accumulates odds from the top tier down", () => {
    const gold = MACHINES.find((m) => m.slug === "pokemon-gold-claw")!;
    expect(cumulativeBps(gold.tiers, "ultra")).toBe(72);
    expect(cumulativeBps(gold.tiers, "rare")).toBe(91);
    expect(cumulativeBps(gold.tiers, "base")).toBe(BPS_TOTAL);
  });

  it("computes an expected value weighted by the odds", () => {
    const tiers = MACHINES[0].tiers;
    const items = [
      { id: "a", name: "a", grader: "PSA" as const, grade: "10", marketValue: 60 },
      { id: "b", name: "b", grader: "PSA" as const, grade: "10", marketValue: 10000 },
    ];
    // 70% base tier at $60 + 0.5% ultra at $10 000 = 42 + 50 = 92
    expect(averageValue(tiers, items)).toBe(92);
  });
});
