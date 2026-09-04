import type { Machine, Promo } from "./types";

const SWAP_POINTS_MULTIPLIER = 1.6;
/** How long a swap offer stays open after a pull. */
export const SWAP_WINDOW_MS = 15 * 60 * 1000;

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

interface Quote {
  unitPrice: number;
  quantity: number;
  subtotal: number;
  discount: number;
  total: number;
  points: number;
}

export function priceFor(machine: Machine, quantity: number, promo?: Promo | null): Quote {
  const qty = clampQuantity(quantity, machine.maxQuantity);
  const subtotal = round2(machine.price * qty);
  const discount = promo ? round2((subtotal * promo.discountPct) / 100) : 0;
  return {
    unitPrice: machine.price,
    quantity: qty,
    subtotal,
    discount,
    total: round2(subtotal - discount),
    points: machine.pointsPerPull * qty,
  };
}

export function clampQuantity(quantity: number, max: number): number {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(Math.max(Math.trunc(quantity), 1), max);
}

/** Instant swap payout for an item, e.g. $14,200 at 85% → $12,070. */
export function swapValue(marketValue: number, swapPct: number): number {
  return round2((marketValue * swapPct) / 100);
}

/** Points earned on a swap (design: $42.30 credited → +68 points). */
export function swapPoints(credited: number): number {
  return Math.round(credited * SWAP_POINTS_MULTIPLIER);
}
