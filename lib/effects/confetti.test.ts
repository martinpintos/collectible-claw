import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireSideCannons, VOLLEYS } from "./confetti";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("side cannons", () => {
  it("aims every volley in from off both edges", () => {
    for (const volley of VOLLEYS) {
      expect(volley.left.origin?.x).toBeLessThanOrEqual(0);
      expect(volley.right.origin?.x).toBeGreaterThanOrEqual(1);
      // Left fires up-and-right, right fires up-and-left, so the streams cross.
      expect(volley.left.angle).toBeGreaterThan(0);
      expect(volley.left.angle).toBeLessThan(90);
      expect(volley.right.angle).toBeGreaterThan(90);
      expect(volley.right.angle).toBeLessThan(180);
    }
  });

  it("fires both cannons for each volley", async () => {
    const confetti = vi.fn();
    fireSideCannons({ load: () => Promise.resolve(confetti) });

    await vi.advanceTimersByTimeAsync(0);
    expect(confetti).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1000);
    expect(confetti).toHaveBeenCalledTimes(VOLLEYS.length * 2);
  });

  it("drops pending volleys once cancelled", async () => {
    const confetti = vi.fn();
    const cancel = fireSideCannons({ load: () => Promise.resolve(confetti) });

    await vi.advanceTimersByTimeAsync(0);
    cancel();
    await vi.advanceTimersByTimeAsync(1000);

    expect(confetti).toHaveBeenCalledTimes(2);
  });

  it("never fires when cancelled before the library resolves", async () => {
    const confetti = vi.fn();
    const cancel = fireSideCannons({ load: () => Promise.resolve(confetti) });

    cancel();
    await vi.advanceTimersByTimeAsync(1000);

    expect(confetti).not.toHaveBeenCalled();
  });
});
