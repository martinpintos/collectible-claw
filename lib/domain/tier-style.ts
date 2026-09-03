import type { TierId } from "./types";

export const TIER_COLOR_VAR: Record<TierId, string> = {
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

export const TIER_LABEL: Record<TierId, string> = {
  ultra: "Ultra-Rare",
  rare: "Rare",
  uncommon: "Uncommon",
  common: "Common",
  base: "Base",
};

/** Glow strength used by the reveal screens (0 = none). */
export const TIER_GLOW: Record<TierId, number> = {
  ultra: 1,
  rare: 0.8,
  uncommon: 0.5,
  common: 0.25,
  base: 0,
};

/** Raw hex values (for canvas-confetti, which cannot read CSS variables). */
export const TIER_COLOR_HEX: Record<TierId, string> = {
  ultra: "#fbbf24",
  rare: "#c084fc",
  uncommon: "#6ee7b7",
  common: "#60a5fa",
  base: "#aaaaaa",
};
