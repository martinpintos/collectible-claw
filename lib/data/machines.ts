import { percentagesToBps } from "@/lib/domain/odds";
import type { Machine, RarityTier, TierId } from "@/lib/domain/types";

const sharedMedia = {
  idle: "/media/idle.mp4",
  poster: "/media/solana-claw.webp",
  revealWeb: "/media/reveal-web.mp4",
  revealMobile: "/media/reveal-mobile.mp4",
};

/** All four machines share the one idle clip that was provided; only the capsule icon differs. */
const media = (icon: string) => ({ ...sharedMedia, icon: `/media/machines/${icon}.png` });

const LABELS: Record<TierId, string> = {
  ultra: "Ultra-Rare",
  rare: "Rare",
  uncommon: "Uncommon",
  common: "Common",
  base: "Base",
};

function tiers(
  percentages: Record<TierId, number>,
  ranges: Record<TierId, [number, number | null]>,
): RarityTier[] {
  const bps = percentagesToBps(percentages);
  return (Object.keys(LABELS) as TierId[]).map((id) => ({
    id,
    label: LABELS[id],
    oddsBps: bps[id],
    minValue: ranges[id][0],
    maxValue: ranges[id][1],
  }));
}

export const DEFAULT_MACHINE_SLUG = "solana-claw";

export const MACHINES: Machine[] = [
  {
    id: "m_solana",
    slug: "solana-claw",
    name: "Solana Claw",
    shortName: "Solana",
    description:
      "Every pull is a statement piece, every grail secured with Brink's and tokenized on Beezie. Open instantly to reveal your collectible and decide whether to hold or swap.",
    price: 100,
    pointsPerPull: 100,
    swapPct: 85,
    maxQuantity: 10,
    media: media("solana"),
    tiers: tiers(
      { ultra: 0.5, rare: 1.5, uncommon: 6, common: 22, base: 70 },
      {
        ultra: [5001, null],
        rare: [1001, 5000],
        uncommon: [301, 1000],
        common: [101, 300],
        base: [50, 100],
      },
    ),
  },
  {
    id: "m_gold",
    slug: "pokemon-gold-claw",
    name: "Pokémon Gold Claw",
    shortName: "Gold TCG",
    description:
      "Every pull is a statement piece, every grail secured with Brink's and tokenized on Beezie.",
    price: 500,
    pointsPerPull: 250,
    swapPct: 90,
    maxQuantity: 10,
    media: media("gold"),
    tiers: tiers(
      { ultra: 0.72, rare: 0.19, uncommon: 3.48, common: 21.08, base: 75.05 },
      {
        ultra: [8001, null],
        rare: [5001, 8000],
        uncommon: [1501, 5000],
        common: [501, 1500],
        base: [250, 500],
      },
    ),
  },
  {
    id: "m_silver",
    slug: "silver-tcg",
    name: "Silver TCG",
    shortName: "Silver TCG",
    description:
      "Packed with high-tier Pokémon grails - from graded slabs to sealed booster boxes - the TCG Silver Claw is made for serious collectors chasing premium hits.",
    price: 50,
    pointsPerPull: 63,
    swapPct: 85,
    maxQuantity: 10,
    media: media("silver"),
    tiers: tiers(
      { ultra: 0.18, rare: 0.59, uncommon: 4.99, common: 26.03, base: 68.21 },
      {
        ultra: [751, null],
        rare: [251, 750],
        uncommon: [101, 250],
        common: [51, 100],
        base: [25, 50],
      },
    ),
  },
  {
    id: "m_wildcard",
    slug: "wildcard",
    name: "Wildcard",
    shortName: "Wildcard",
    description:
      "Anything goes. Pokémon, One Piece and sealed product mixed into one machine for collectors who like surprises.",
    price: 30,
    pointsPerPull: 30,
    swapPct: 85,
    maxQuantity: 10,
    media: media("wildcard"),
    tiers: tiers(
      { ultra: 0.1, rare: 0.4, uncommon: 4.5, common: 25, base: 70 },
      {
        ultra: [501, null],
        rare: [151, 500],
        uncommon: [61, 150],
        common: [31, 60],
        base: [15, 30],
      },
    ),
  },
];

export function findMachine(slug: string): Machine | undefined {
  return MACHINES.find((m) => m.slug === slug);
}
