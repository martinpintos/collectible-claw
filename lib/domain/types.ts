export type TierId = "ultra" | "rare" | "uncommon" | "common" | "base";

/** Display order, highest tier first (matches the odds grid in the design). */
export const TIER_ORDER: readonly TierId[] = ["ultra", "rare", "uncommon", "common", "base"];

export interface RarityTier {
  id: TierId;
  label: string;
  /** Odds in basis points; all tiers of a machine sum to exactly 10 000. */
  oddsBps: number;
  /** Inclusive market-value bounds in USD. `maxValue` is null for the top tier. */
  minValue: number;
  maxValue: number | null;
}

export interface MachineMedia {
  idle: string;
  poster: string;
  /** Capsule icon used in the "More Claw Machines" row. */
  icon: string;
  revealWeb: string;
  revealMobile: string;
}

export interface Machine {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  /** Price per pull in USD. */
  price: number;
  /** Loyalty points granted per pull. */
  pointsPerPull: number;
  /** Instant swap payout as a percentage of market value. */
  swapPct: number;
  maxQuantity: number;
  media: MachineMedia;
  tiers: RarityTier[];
}

export type Grader = "PSA" | "BGS" | "CGC";

/** A card in the global pool. Tier is machine-specific and resolved at read time. */
export interface CatalogEntry {
  id: string;
  name: string;
  grader: Grader;
  grade: string;
  set?: string;
  year?: number;
  marketValue: number;
}

export interface CatalogItem extends CatalogEntry {
  machineId: string;
  tier: TierId;
  /** Public URL of the slab photo when one has been exported, otherwise null. */
  imageSrc: string | null;
}

export interface PulledItem extends CatalogItem {
  instanceId: string;
  swapValue: number;
}

export interface WalletSnapshot {
  balance: number;
  points: number;
}

export interface PullResult {
  pullId: string;
  machineSlug: string;
  quantity: number;
  items: PulledItem[];
  unitPrice: number;
  discount: number;
  totalPaid: number;
  pointsEarned: number;
  wallet: WalletSnapshot;
  /** ISO timestamp after which the swap offer is no longer honoured. */
  expiresAt: string;
}

export interface SwapResult {
  pullId: string;
  swappedItemIds: string[];
  credited: number;
  points: number;
  wallet: WalletSnapshot;
}

export interface TopItem {
  id: string;
  name: string;
  grade: string;
  grader: Grader;
  fmv: number;
  tier: TierId;
  imageSrc: string | null;
}

export interface RecentPull {
  id: string;
  itemId: string;
  itemName: string;
  user: string;
  price: number;
  imageSrc: string | null;
  at: string;
}

export interface Prefs {
  sound: boolean;
  animation: boolean;
}

export interface Promo {
  code: string;
  discountPct: number;
  label: string;
}

export type PaymentMethod = "wallet" | "card";
export type WalletChoice = "beezie" | "external";

export type ActionErrorCode =
  | "INVALID_INPUT"
  | "INSUFFICIENT_FUNDS"
  | "NOT_FOUND"
  | "EXPIRED"
  | "INVALID_PROMO";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code: ActionErrorCode };
