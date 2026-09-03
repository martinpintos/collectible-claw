import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PulledItem } from "@/lib/domain/types";
import { RevealMulti } from "./RevealMulti";

vi.mock("@number-flow/react", () => import("@/test/mocks/number-flow"));

function item(id: string, swapValue: number): PulledItem {
  return {
    id: `cat_${id}`,
    instanceId: id,
    machineId: "m",
    name: `Card ${id}`,
    grader: "PSA",
    grade: "PSA 10",
    marketValue: swapValue / 0.85,
    tier: "common",
    imageSrc: null,
    swapValue,
  };
}

const items = [item("a", 100), item("b", 200), item("c", 300)];

function setup(overrides: Partial<React.ComponentProps<typeof RevealMulti>> = {}) {
  const props = {
    items,
    selectedIds: [] as string[],
    selectedTotal: 0,
    expiresAt: new Date(Date.now() + 869_000).toISOString(),
    expired: false,
    pending: false,
    pendingItemId: null,
    error: null,
    onToggle: vi.fn(),
    onSelectAll: vi.fn(),
    onClear: vi.fn(),
    onSwapSelected: vi.fn(),
    onSwapOne: vi.fn(),
    onExpire: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  render(<RevealMulti {...props} />);
  return props;
}

describe("RevealMulti", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps Swap disabled until something is selected", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const props = setup();
    expect(screen.getByRole("button", { name: "Swap" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Select all" }));
    expect(props.onSelectAll).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /Select Card b/ }));
    expect(props.onToggle).toHaveBeenCalledWith("b");
  });

  it("names the count and running total, and offers Clear, when everything is selected", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const props = setup({ selectedIds: ["a", "b", "c"], selectedTotal: 600 });
    const swap = screen.getByRole("button", { name: "Swap 3 items for $600" });
    expect(swap).toBeEnabled();
    await user.click(swap);
    expect(props.onSwapSelected).toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(props.onClear).toHaveBeenCalled();
  });

  it("uses the singular noun for one selected item", () => {
    setup({ selectedIds: ["a"], selectedTotal: 100 });
    expect(screen.getByRole("button", { name: "Swap 1 item for $100" })).toBeEnabled();
  });

  it("swaps a single card from its own button", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const props = setup();
    await user.click(screen.getByRole("button", { name: "Swap for $200" }));
    expect(props.onSwapOne).toHaveBeenCalledWith("b");
  });

  it("renders the countdown and expires the offer at zero", () => {
    const props = setup({ expiresAt: new Date(Date.now() + 2_500).toISOString() });
    expect(screen.getByText(/Expires in:/)).toBeInTheDocument();
    expect(screen.getByText("0 min 2 sec")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(3_100);
    });
    expect(props.onExpire).toHaveBeenCalled();
  });

  it("disables everything once expired", () => {
    setup({ expired: true });
    expect(screen.getByText("Offer expired")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Swap for $100" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Select all" })).toBeDisabled();
  });
});
