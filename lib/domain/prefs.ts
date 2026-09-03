import type { Prefs } from "./types";

export const PREFS_COOKIE = "cc_prefs";
export const PREFS_MAX_AGE = 60 * 60 * 24 * 365;
export const DEFAULT_PREFS: Prefs = { sound: false, animation: true };

/** Compact cookie payload, e.g. "s1a0" = sound on, animation off. */
export function serializePrefs(prefs: Prefs): string {
  return `s${prefs.sound ? 1 : 0}a${prefs.animation ? 1 : 0}`;
}

export function parsePrefs(raw: string | undefined | null): Prefs {
  if (!raw) return { ...DEFAULT_PREFS };
  const match = /^s([01])a([01])$/.exec(raw.trim());
  if (!match) return { ...DEFAULT_PREFS };
  return { sound: match[1] === "1", animation: match[2] === "1" };
}

export function prefsCookieString(prefs: Prefs): string {
  return `${PREFS_COOKIE}=${serializePrefs(prefs)}; Path=/; Max-Age=${PREFS_MAX_AGE}; SameSite=Lax`;
}
