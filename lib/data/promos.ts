import type { Promo } from "@/lib/domain/types";

export const PROMOS: Promo[] = [
  { code: "BEEZIE10", discountPct: 10, label: "10% off this pull" },
  { code: "CLAW20", discountPct: 20, label: "20% off this pull" },
  { code: "WELCOME5", discountPct: 5, label: "5% welcome discount" },
];

export function normalizePromoCode(code: string): string {
  return code.trim().toUpperCase().slice(0, 20);
}

export function findPromo(code: string): Promo | undefined {
  const normalized = normalizePromoCode(code);
  return PROMOS.find((p) => p.code === normalized);
}
