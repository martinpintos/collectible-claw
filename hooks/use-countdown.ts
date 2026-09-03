"use client";

import { useSyncExternalStore } from "react";
import { getTickerNow, getTickerServerNow, subscribeTicker } from "@/lib/time/ticker";

/** Milliseconds remaining until `expiresAt` (ISO). Null before the first client tick. */
export function useCountdown(expiresAt: string | null | undefined): number | null {
  const now = useSyncExternalStore(subscribeTicker, getTickerNow, getTickerServerNow);
  if (!expiresAt || now === 0) return null;
  return Math.max(0, Date.parse(expiresAt) - now);
}
