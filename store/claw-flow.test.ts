import { describe, expect, it } from "vitest";
import type { PullResult, PulledItem, SwapResult } from "@/lib/domain/types";
import {
  canSwap,
  createClawFlowStore,
  createInitialState,
  selectedTotal,
  transition,
  type FlowEvent,
  type FlowState,
} from "./claw-flow";

function item(id: string, swapValue: number): PulledItem {
  return {
    id: `cat_${id}`,
    instanceId: id,
    machineId: "m",
    name: `Item ${id}`,
    grader: "PSA",
    grade: "PSA 10",
    marketValue: swapValue / 0.85,
    tier: "common",
    imageSrc: null,
    swapValue,
  };
}

function pull(count: number): PullResult {
  return {
    pullId: "p1",
    machineSlug: "solana-claw",
    quantity: count,
    items: Array.from({ length: count }, (_, i) => item(`i${i + 1}`, 100 * (i + 1))),
    unitPrice: 100,
    discount: 0,
    totalPaid: 100 * count,
    pointsEarned: 100 * count,
    wallet: { balance: 2400, points: 100 },
    expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
  };
}

const swap: SwapResult = {
  pullId: "p1",
  swappedItemIds: ["i1"],
  credited: 100,
  points: 160,
  wallet: { balance: 2500, points: 260 },
};

const initial = createInitialState({ machineSlug: "solana-claw", maxQuantity: 10 });

function run(events: FlowEvent[], from: FlowState = initial): FlowState {
  return events.reduce((state, event) => transition(state, event), from);
}

describe("transition – guards", () => {
  it("only START leaves idle, and ignored events keep the same reference", () => {
    expect(transition(initial, { type: "CONFIRM" })).toBe(initial);
    expect(transition(initial, { type: "SWAP" })).toBe(initial);
    expect(transition(initial, { type: "CLOSE" })).toBe(initial);
    expect(transition(initial, { type: "START" }).phase).toBe("payment");
  });

  it("clamps quantity into [1, max] in idle and payment only", () => {
    expect(run([{ type: "DECREMENT" }]).quantity).toBe(1);
    expect(run([{ type: "SET_QUANTITY", quantity: 99 }]).quantity).toBe(10);
    expect(run([{ type: "INCREMENT" }, { type: "INCREMENT" }]).quantity).toBe(3);
    const preparing = run([{ type: "START" }, { type: "CONFIRM" }]);
    expect(transition(preparing, { type: "INCREMENT" })).toBe(preparing);
  });

  it("CONFIRM only from payment; CLOSE from payment cancels without charge", () => {
    const payment = run([{ type: "START" }]);
    expect(transition(payment, { type: "CLOSE" }).phase).toBe("idle");
    expect(transition(payment, { type: "CONFIRM" }).phase).toBe("preparing");
  });

  it("CLOSE is ignored while preparing, opening or swapping", () => {
    const preparing = run([{ type: "START" }, { type: "CONFIRM" }]);
    expect(transition(preparing, { type: "CLOSE" })).toBe(preparing);
    const opening = run(
      [{ type: "PULL_SUCCEEDED", pull: pull(1) }, { type: "VIDEO_READY" }, { type: "MIN_TIMER_DONE" }],
      preparing,
    );
    expect(opening.phase).toBe("opening");
    expect(transition(opening, { type: "CLOSE" })).toBe(opening);
    const swapping = run([{ type: "VIDEO_ENDED" }, { type: "SWAP" }], opening);
    expect(swapping.phase).toBe("swapping");
    expect(transition(swapping, { type: "CLOSE" })).toBe(swapping);
  });
});

describe("transition – preparing → opening", () => {
  const preparing = run([{ type: "START" }, { type: "CONFIRM" }]);
  const gates: FlowEvent[] = [
    { type: "PULL_SUCCEEDED", pull: pull(1) },
    { type: "VIDEO_READY" },
    { type: "MIN_TIMER_DONE" },
  ];
  const permutations = [
    [0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0],
  ];

  it.each(permutations)("advances only after all three gates (order %j)", (...order) => {
    let state = preparing;
    for (let i = 0; i < order.length; i++) {
      state = transition(state, gates[order[i]]);
      expect(state.phase).toBe(i === order.length - 1 ? "opening" : "preparing");
    }
  });

  it("VIDEO_READY can arrive before START and is remembered", () => {
    const state = run([{ type: "VIDEO_READY" }, { type: "START" }, { type: "CONFIRM" }, { type: "PULL_SUCCEEDED", pull: pull(1) }, { type: "MIN_TIMER_DONE" }]);
    expect(state.phase).toBe("opening");
  });

  it("PULL_FAILED returns to payment with the error", () => {
    const state = transition(preparing, { type: "PULL_FAILED", error: "Insufficient funds" });
    expect(state.phase).toBe("payment");
    expect(state.error).toBe("Insufficient funds");
  });
});

describe("transition – reveal and swap", () => {
  const revealMulti = run([
    { type: "START" }, { type: "SET_QUANTITY", quantity: 3 }, { type: "CONFIRM" },
    { type: "PULL_SUCCEEDED", pull: pull(3) }, { type: "VIDEO_READY" }, { type: "MIN_TIMER_DONE" },
    { type: "VIDEO_TAIL" },
  ]);
  const revealSingle = run([
    { type: "START" }, { type: "CONFIRM" },
    { type: "PULL_SUCCEEDED", pull: pull(1) }, { type: "VIDEO_READY" }, { type: "MIN_TIMER_DONE" },
    { type: "VIDEO_ENDED" },
  ]);

  it("single pulls auto-select their only item", () => {
    expect(revealSingle.selectedIds).toEqual(["i1"]);
    expect(canSwap(revealSingle)).toBe(true);
  });

  it("multi pulls start with nothing selected and Swap disabled", () => {
    expect(revealMulti.selectedIds).toEqual([]);
    expect(canSwap(revealMulti)).toBe(false);
    expect(transition(revealMulti, { type: "SWAP" })).toBe(revealMulti);
  });

  it("toggle / select all / clear keep a running total", () => {
    let state = transition(revealMulti, { type: "TOGGLE_SELECT", id: "i2" });
    expect(selectedTotal(state)).toBe(200);
    state = transition(state, { type: "SELECT_ALL" });
    expect(selectedTotal(state)).toBe(600);
    expect(transition(state, { type: "SELECT_ALL" })).toBe(state);
    state = transition(state, { type: "TOGGLE_SELECT", id: "i1" });
    expect(state.selectedIds).toEqual(["i2", "i3"]);
    state = transition(state, { type: "CLEAR_SELECTION" });
    expect(state.selectedIds).toEqual([]);
    expect(transition(state, { type: "TOGGLE_SELECT", id: "nope" })).toBe(state);
  });

  it("a clip that cannot play still reaches the reveal", () => {
    const opening = run(
      [{ type: "START" }, { type: "CONFIRM" }, { type: "PULL_SUCCEEDED", pull: pull(1) }, { type: "VIDEO_READY" }, { type: "MIN_TIMER_DONE" }],
    );
    expect(opening.phase).toBe("opening");
    expect(transition(opening, { type: "VIDEO_UNAVAILABLE" }).phase).toBe("reveal");
  });

  it("video events are idempotent once in reveal", () => {
    expect(transition(revealSingle, { type: "VIDEO_ENDED" })).toBe(revealSingle);
    expect(transition(revealSingle, { type: "VIDEO_TAIL" })).toBe(revealSingle);
  });

  it("swap succeeds into swapped and closes back to idle keeping quantity/promo", () => {
    const withPromo = { ...revealMulti, promo: { code: "BEEZIE10", discountPct: 10, label: "" } };
    let state = run([{ type: "SELECT_ALL" }, { type: "SWAP" }], withPromo);
    expect(state.phase).toBe("swapping");
    state = transition(state, { type: "SWAP_SUCCEEDED", swap });
    expect(state.phase).toBe("swapped");
    expect(state.swap).toBe(swap);
    state = transition(state, { type: "CLOSE" });
    expect(state.phase).toBe("idle");
    expect(state.pull).toBeNull();
    expect(state.quantity).toBe(3);
    expect(state.promo?.code).toBe("BEEZIE10");
    expect(state.videoReady).toBe(true);
  });

  it("swap failure returns to reveal with error", () => {
    const state = run([{ type: "SELECT_ALL" }, { type: "SWAP" }, { type: "SWAP_FAILED", error: "boom" }], revealMulti);
    expect(state.phase).toBe("reveal");
    expect(state.error).toBe("boom");
  });

  it("expiry clears the selection and blocks swapping", () => {
    const state = run([{ type: "SELECT_ALL" }, { type: "EXPIRE" }], revealMulti);
    expect(state.expired).toBe(true);
    expect(state.selectedIds).toEqual([]);
    expect(transition(state, { type: "SELECT_ALL" })).toBe(state);
    expect(transition(state, { type: "SWAP" })).toBe(state);
  });

  it("KEEP resets to idle", () => {
    expect(transition(revealSingle, { type: "KEEP" }).phase).toBe("idle");
  });
});

describe("createClawFlowStore", () => {
  it("dispatches through the reducer and notifies subscribers only on change", () => {
    const store = createClawFlowStore({ machineSlug: "solana-claw", maxQuantity: 10 });
    let notifications = 0;
    store.subscribe(() => notifications++);
    store.getState().dispatch({ type: "CONFIRM" });
    expect(notifications).toBe(0);
    store.getState().dispatch({ type: "START" });
    expect(notifications).toBe(1);
    expect(store.getState().phase).toBe("payment");
  });
});
