import type { MachineMedia } from "@/lib/domain/types";

export type RevealVariant = "web" | "mobile";

/** Verified timeline of the reveal clip (both variants share it). */
export const REVEAL_DURATION_S = 5.674;
/** Rings finish expanding here; the result can begin fading in underneath. */
export const REVEAL_TAIL_AT_S = 5.4;

/** Known sizes let the progress bar be accurate even without Content-Length. */
export const KNOWN_BYTES: Record<RevealVariant, number> = {
  web: 2_322_076,
  mobile: 1_272_242,
};

/** Portrait screens get the square clip; everything else the 16:9 one. Decided once per page. */
export function pickRevealVariant(): RevealVariant {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return "web";
  return window.matchMedia("(orientation: portrait)").matches ? "mobile" : "web";
}

export function revealSource(media: MachineMedia, variant: RevealVariant): string {
  return variant === "mobile" ? media.revealMobile : media.revealWeb;
}
