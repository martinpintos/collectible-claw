import { createStore } from "zustand/vanilla";
import { clampQuantity } from "@/lib/domain/pricing";
import type {
  PaymentMethod,
  Promo,
  PullResult,
  SwapResult,
  WalletChoice,
} from "@/lib/domain/types";

export type Phase =
  | "idle"
  | "payment"
  | "preparing"
  | "opening"
  | "reveal"
  | "swapping"
  | "swapped";

export interface FlowState {
  phase: Phase;
  machineSlug: string;
  quantity: number;
  maxQuantity: number;
  promo: Promo | null;
  paymentMethod: PaymentMethod;
  wallet: WalletChoice;
  pull: PullResult | null;
  error: string | null;
  /** Reveal clip is fully buffered and attached to the persistent <video>. */
  videoReady: boolean;
  /** The "Do not refresh" minimum dwell has elapsed. */
  minTimerDone: boolean;
  selectedIds: string[];
  swap: SwapResult | null;
  /** The 15-minute swap window closed while the reveal was open. */
  expired: boolean;
}

export type FlowEvent =
  | { type: "START" }
  | { type: "SET_QUANTITY"; quantity: number }
  | { type: "INCREMENT" }
  | { type: "DECREMENT" }
  | { type: "SET_PROMO"; promo: Promo | null }
  | { type: "SET_PAYMENT_METHOD"; method: PaymentMethod }
  | { type: "SET_WALLET"; wallet: WalletChoice }
  | { type: "CONFIRM" }
  | { type: "PULL_SUCCEEDED"; pull: PullResult }
  | { type: "PULL_FAILED"; error: string }
  | { type: "VIDEO_READY" }
  | { type: "MIN_TIMER_DONE" }
  | { type: "VIDEO_TAIL" }
  | { type: "VIDEO_ENDED" }
  | { type: "SKIP_VIDEO" }
  | { type: "TOGGLE_SELECT"; id: string }
  | { type: "SELECT_ALL" }
  | { type: "CLEAR_SELECTION" }
  | { type: "SWAP" }
  | { type: "SWAP_SUCCEEDED"; swap: SwapResult }
  | { type: "SWAP_FAILED"; error: string }
  | { type: "EXPIRE" }
  | { type: "KEEP" }
  | { type: "CLOSE" }
  | { type: "RESET" };

export function createInitialState(init: {
  machineSlug: string;
  maxQuantity: number;
  quantity?: number;
}): FlowState {
  return {
    phase: "idle",
    machineSlug: init.machineSlug,
    quantity: clampQuantity(init.quantity ?? 1, init.maxQuantity),
    maxQuantity: init.maxQuantity,
    promo: null,
    paymentMethod: "wallet",
    wallet: "beezie",
    pull: null,
    error: null,
    videoReady: false,
    minTimerDone: false,
    selectedIds: [],
    swap: null,
    expired: false,
  };
}

function resetToIdle<S extends FlowState>(state: S): S {
  return {
    ...state,
    phase: "idle",
    pull: null,
    error: null,
    minTimerDone: false,
    selectedIds: [],
    swap: null,
    expired: false,
  };
}

/** preparing → opening once the pull result, the buffered video and the dwell timer are all in. */
function maybeAdvance<S extends FlowState>(state: S): S {
  if (state.phase === "preparing" && state.pull && state.videoReady && state.minTimerDone) {
    return { ...state, phase: "opening" };
  }
  return state;
}

/**
 * Pure state machine for the pull flow. Ignored events return the *same* state
 * reference so subscribers can bail out cheaply and tests can assert on identity.
 */
export function transition<S extends FlowState>(state: S, event: FlowEvent): S {
  switch (event.type) {
    case "START":
      if (state.phase !== "idle") return state;
      return { ...resetToIdle(state), phase: "payment" };

    case "SET_QUANTITY":
    case "INCREMENT":
    case "DECREMENT": {
      if (state.phase !== "idle" && state.phase !== "payment") return state;
      const target =
        event.type === "SET_QUANTITY"
          ? event.quantity
          : state.quantity + (event.type === "INCREMENT" ? 1 : -1);
      const quantity = clampQuantity(target, state.maxQuantity);
      return quantity === state.quantity ? state : { ...state, quantity };
    }

    case "SET_PROMO":
      if (state.phase !== "idle" && state.phase !== "payment") return state;
      return { ...state, promo: event.promo };

    case "SET_PAYMENT_METHOD":
      if (state.phase !== "payment") return state;
      return { ...state, paymentMethod: event.method };

    case "SET_WALLET":
      if (state.phase !== "payment") return state;
      return { ...state, wallet: event.wallet };

    case "CONFIRM":
      if (state.phase !== "payment") return state;
      return { ...state, phase: "preparing", error: null, pull: null, minTimerDone: false };

    case "PULL_SUCCEEDED": {
      if (state.phase !== "preparing") return state;
      const selectedIds =
        event.pull.items.length === 1 ? [event.pull.items[0].instanceId] : [];
      return maybeAdvance({ ...state, pull: event.pull, selectedIds, expired: false });
    }

    case "PULL_FAILED":
      if (state.phase !== "preparing") return state;
      return { ...state, phase: "payment", error: event.error, pull: null };

    case "VIDEO_READY":
      if (state.videoReady) return state;
      return maybeAdvance({ ...state, videoReady: true });

    case "MIN_TIMER_DONE":
      if (state.phase !== "preparing" || state.minTimerDone) return state;
      return maybeAdvance({ ...state, minTimerDone: true });

    case "VIDEO_TAIL":
    case "VIDEO_ENDED":
    case "SKIP_VIDEO":
      if (state.phase !== "opening") return state;
      return { ...state, phase: "reveal" };

    case "TOGGLE_SELECT": {
      if (state.phase !== "reveal" || state.expired || !state.pull) return state;
      if (!state.pull.items.some((item) => item.instanceId === event.id)) return state;
      const selectedIds = state.selectedIds.includes(event.id)
        ? state.selectedIds.filter((id) => id !== event.id)
        : [...state.selectedIds, event.id];
      return { ...state, selectedIds };
    }

    case "SELECT_ALL": {
      if (state.phase !== "reveal" || state.expired || !state.pull) return state;
      const all = state.pull.items.map((item) => item.instanceId);
      if (all.length === state.selectedIds.length) return state;
      return { ...state, selectedIds: all };
    }

    case "CLEAR_SELECTION":
      if (state.phase !== "reveal" || state.selectedIds.length === 0) return state;
      return { ...state, selectedIds: [] };

    case "SWAP":
      if (state.phase !== "reveal" || state.expired || state.selectedIds.length === 0) return state;
      return { ...state, phase: "swapping", error: null };

    case "SWAP_SUCCEEDED":
      if (state.phase !== "swapping") return state;
      return { ...state, phase: "swapped", swap: event.swap };

    case "SWAP_FAILED":
      if (state.phase !== "swapping") return state;
      return { ...state, phase: "reveal", error: event.error };

    case "EXPIRE":
      if (state.phase !== "reveal" || state.expired) return state;
      return { ...state, expired: true, selectedIds: [] };

    case "KEEP":
      if (state.phase !== "reveal") return state;
      return resetToIdle(state);

    case "CLOSE":
      if (state.phase === "payment" || state.phase === "reveal" || state.phase === "swapped") {
        return resetToIdle(state);
      }
      return state;

    case "RESET":
      return resetToIdle(state);

    default:
      return state;
  }
}

/* ------------------------------------------------------------------ selectors */
export const isMulti = (s: FlowState) => (s.pull?.items.length ?? 0) > 1;
export const selectedItems = (s: FlowState) =>
  s.pull?.items.filter((item) => s.selectedIds.includes(item.instanceId)) ?? [];
export const selectedTotal = (s: FlowState) =>
  Math.round(selectedItems(s).reduce((sum, item) => sum + item.swapValue, 0) * 100) / 100;
export const canSwap = (s: FlowState) =>
  s.phase === "reveal" && !s.expired && s.selectedIds.length > 0;
export const isOpen = (s: FlowState) => s.phase !== "idle";
export const isBusy = (s: FlowState) =>
  s.phase === "preparing" || s.phase === "opening" || s.phase === "swapping";

/* --------------------------------------------------------------------- store */
export type FlowStore = FlowState & { dispatch: (event: FlowEvent) => void };

export function createClawFlowStore(init: Parameters<typeof createInitialState>[0]) {
  return createStore<FlowStore>((set) => ({
    ...createInitialState(init),
    dispatch: (event) => set((state) => transition(state, event)),
  }));
}

export type ClawFlowStoreApi = ReturnType<typeof createClawFlowStore>;
