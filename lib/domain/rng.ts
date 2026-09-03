export type Rng = () => number;

/** Deterministic 32-bit PRNG for tests and seeded previews. Returns [0, 1). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cryptographically strong RNG (Web Crypto is available in Node ≥ 19 and browsers). */
export function secureRng(): Rng {
  const buffer = new Uint32Array(1);
  return () => {
    globalThis.crypto.getRandomValues(buffer);
    return buffer[0] / 4294967296;
  };
}
