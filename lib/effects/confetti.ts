import type { Options } from "canvas-confetti";

type ConfettiFn = (options: Options) => unknown;

/** Brand golds plus white — the same celebration for every pull, whatever came out. */
const COLORS = ["#ffca28", "#ffe08a", "#fff3c4", "#ffffff"];

const base: Options = {
  spread: 62,
  startVelocity: 52,
  decay: 0.9,
  gravity: 1.05,
  drift: 0,
  ticks: 260,
  scalar: 1,
  colors: COLORS,
  // Above the flow overlay (z-50) and the reveal video layer (z-60).
  zIndex: 80,
};

/**
 * Three volleys fired from just off both edges, so the streams cross in front
 * of the card instead of raining onto it.
 */
export const VOLLEYS: readonly { delay: number; left: Options; right: Options }[] = [
  {
    delay: 0,
    left: { ...base, particleCount: 55, angle: 58, origin: { x: -0.02, y: 0.68 } },
    right: { ...base, particleCount: 55, angle: 122, origin: { x: 1.02, y: 0.68 } },
  },
  {
    delay: 160,
    left: { ...base, particleCount: 34, angle: 64, spread: 72, startVelocity: 46, origin: { x: -0.02, y: 0.74 } },
    right: { ...base, particleCount: 34, angle: 116, spread: 72, startVelocity: 46, origin: { x: 1.02, y: 0.74 } },
  },
  {
    delay: 360,
    left: { ...base, particleCount: 20, angle: 70, spread: 84, startVelocity: 40, scalar: 0.9, origin: { x: -0.02, y: 0.8 } },
    right: { ...base, particleCount: 20, angle: 110, spread: 84, startVelocity: 40, scalar: 0.9, origin: { x: 1.02, y: 0.8 } },
  },
];

const loadConfetti = (): Promise<ConfettiFn> =>
  import("canvas-confetti").then((module) => module.default as ConfettiFn);

/**
 * Fires the side cannons and returns a cancel function: unmounting mid-volley,
 * or closing the reveal early, must not schedule confetti onto a bare page.
 * The library is imported on demand so it stays out of the initial bundle.
 */
export function fireSideCannons({ load = loadConfetti }: { load?: () => Promise<ConfettiFn> } = {}) {
  const timers: ReturnType<typeof setTimeout>[] = [];
  let cancelled = false;

  void load()
    .then((confetti) => {
      if (cancelled) return;
      for (const volley of VOLLEYS) {
        const fire = () => {
          if (cancelled) return;
          confetti(volley.left);
          confetti(volley.right);
        };
        if (volley.delay === 0) fire();
        else timers.push(setTimeout(fire, volley.delay));
      }
    })
    // A failed chunk load costs a celebration, never the reveal itself.
    .catch(() => {});

  return () => {
    cancelled = true;
    for (const timer of timers) clearTimeout(timer);
    timers.length = 0;
  };
}
