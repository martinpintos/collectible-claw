import { describe, expect, it } from "vitest";
import { MACHINES } from "@/lib/data/machines";
import { PROMOS } from "@/lib/data/promos";
import { clampQuantity, priceFor, round2, swapPoints, swapValue } from "./pricing";

const solana = MACHINES.find((m) => m.slug === "solana-claw")!;
const gold = MACHINES.find((m) => m.slug === "pokemon-gold-claw")!;
const beezie10 = PROMOS.find((p) => p.code === "BEEZIE10")!;

describe("priceFor", () => {
  it("multiplies price and points by quantity", () => {
    for (let qty = 1; qty <= 10; qty++) {
      const quote = priceFor(gold, qty);
      expect(quote.subtotal).toBe(500 * qty);
      expect(quote.total).toBe(500 * qty);
      expect(quote.points).toBe(250 * qty);
      expect(quote.discount).toBe(0);
    }
  });

  it("applies a promo as a percentage of the subtotal", () => {
    const quote = priceFor(solana, 3, beezie10);
    expect(quote.subtotal).toBe(300);
    expect(quote.discount).toBe(30);
    expect(quote.total).toBe(270);
    expect(quote.points).toBe(300);
  });

  it("clamps quantity into [1, maxQuantity]", () => {
    expect(priceFor(solana, 0).quantity).toBe(1);
    expect(priceFor(solana, 99).quantity).toBe(solana.maxQuantity);
    expect(clampQuantity(Number.NaN, 10)).toBe(1);
    expect(clampQuantity(4.9, 10)).toBe(4);
  });
});

describe("swap maths", () => {
  it("pays the machine's swap percentage of market value", () => {
    expect(swapValue(14200, 85)).toBe(12070);
    expect(swapValue(14200, 90)).toBe(12780);
  });

  it("rounds to cents", () => {
    expect(swapValue(49.75, 85)).toBe(42.29);
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });

  it("grants points at 1.6x the credited amount (design: $42.30 → +68)", () => {
    expect(swapPoints(42.3)).toBe(68);
    expect(swapPoints(0)).toBe(0);
  });
});
