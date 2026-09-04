import type { TierId } from "./types";

const TIER_COLOR_VAR: Record<TierId, string> = {
  ultra: "var(--color-tier-ultra)",
  rare: "var(--color-tier-rare)",
  uncommon: "var(--color-tier-uncommon)",
  common: "var(--color-tier-common)",
  base: "var(--color-tier-base)",
};

/** Border / gradient colour; Ultra-Rare uses the brand yellow line like the design. */
export const TIER_LINE_VAR: Record<TierId, string> = {
  ...TIER_COLOR_VAR,
  ultra: "var(--color-tier-ultra-line)",
};

export const TIER_TEXT_CLASS: Record<TierId, string> = {
  ultra: "text-tier-ultra",
  rare: "text-tier-rare",
  uncommon: "text-tier-uncommon",
  common: "text-tier-common",
  base: "text-fg",
};
