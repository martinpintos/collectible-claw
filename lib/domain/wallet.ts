import type { WalletSnapshot } from "./types";

export const WALLET_COOKIE = "cc_wallet";
export const WALLET_MAX_AGE = 60 * 60 * 24 * 30;
export const DEFAULT_WALLET: WalletSnapshot = { balance: 2500, points: 0 };
/** Read-only demo balance shown for the "External wallet" option. */
export const EXTERNAL_WALLET_BALANCE = 250;
const MAX_BALANCE = 1_000_000_000;

export function serializeWallet(wallet: WalletSnapshot): string {
  return JSON.stringify({ b: wallet.balance, p: wallet.points });
}

export function parseWallet(raw: string | undefined | null): WalletSnapshot {
  if (!raw) return { ...DEFAULT_WALLET };
  try {
    const parsed = JSON.parse(raw) as { b?: unknown; p?: unknown };
    const balance = Number(parsed.b);
    const points = Number(parsed.p);
    if (!Number.isFinite(balance) || !Number.isFinite(points)) return { ...DEFAULT_WALLET };
    return {
      balance: Math.min(Math.max(Math.round(balance * 100) / 100, 0), MAX_BALANCE),
      points: Math.min(Math.max(Math.round(points), 0), MAX_BALANCE),
    };
  } catch {
    return { ...DEFAULT_WALLET };
  }
}
