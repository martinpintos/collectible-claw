/**
 * Shared 1 Hz clock for countdowns. Components subscribe through
 * useSyncExternalStore so `Date.now()` never runs during render.
 */
let now = 0;
let timer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function tick() {
  now = Date.now();
  listeners.forEach((listener) => listener());
}

export function subscribeTicker(listener: () => void): () => void {
  listeners.add(listener);
  if (!timer) {
    now = Date.now();
    timer = setInterval(tick, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer) {
      clearInterval(timer);
      timer = null;
    }
  };
}

export function getTickerNow(): number {
  return now;
}

export function getTickerServerNow(): number {
  return 0;
}
