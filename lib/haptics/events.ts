import type { HapticInput } from "web-haptics";

/**
 * Semantic haptic vocabulary used across the app. Patterns are expressed in
 * web-haptics terms (preset names or {duration, intensity, delay} arrays) so
 * they run through navigator.vibrate on Android and the iOS switch trick on
 * Safari without the UI knowing which one is in use.
 */
export type HapticEvent =
  | "tap"
  | "select"
  | "tick"
  | "confirm"
  | "error"
  | "success";

export const HAPTIC_PATTERNS: Record<HapticEvent, HapticInput> = {
  tap: "light",
  select: "selection",
  tick: "rigid",
  confirm: "medium",
  error: "error",
  success: "success",
};

/** Default intensity per event (0..1) when the caller does not override it. */
export const HAPTIC_INTENSITY: Partial<Record<HapticEvent, number>> = {
  tick: 0.35,
  tap: 0.5,
  select: 0.6,
  confirm: 0.8,
};
