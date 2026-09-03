import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MACHINES } from "@/lib/data/machines";
import { PaymentModal } from "./PaymentModal";

vi.mock("@number-flow/react", () => import("@/test/mocks/number-flow"));

const machine = MACHINES.find((m) => m.slug === "solana-claw")!;

function setup(overrides: Partial<React.ComponentProps<typeof PaymentModal>> = {}) {
  const props = {
    machine,
    wallet: { balance: 2500, points: 0 },
    quantity: 3,
    promo: null,
    paymentMethod: "wallet" as const,
    walletChoice: "beezie" as const,
    error: null,
    pending: false,
    onConfirm: vi.fn(),
    dispatch: vi.fn(),
    ...overrides,
  };
  render(<PaymentModal {...props} />);
  return props;
}

describe("PaymentModal", () => {
  it("summarises the order and confirms", async () => {
    const user = userEvent.setup();
    const props = setup();
    expect(screen.getByRole("heading", { name: /review & pay/i })).toBeInTheDocument();
    expect(screen.getByText("Quantity: 3")).toBeInTheDocument();
    expect(screen.getByText("$300")).toBeInTheDocument();
    expect(screen.getByText("+300 pts")).toBeInTheDocument();
    expect(screen.getByText("$2,500")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(props.onConfirm).toHaveBeenCalledTimes(1);
  });

  it("shows the discount line for a promo", () => {
    setup({ promo: { code: "BEEZIE10", discountPct: 10, label: "10% off" } });
    expect(screen.getByText("$270")).toBeInTheDocument();
    expect(screen.getByText("−$30.00")).toBeInTheDocument();
  });

  it("switches to the card placeholder and dispatches the method", async () => {
    const user = userEvent.setup();
    const props = setup({ paymentMethod: "card" });
    expect(screen.getByText("Coinflow widget")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "Wallet" }));
    expect(props.dispatch).toHaveBeenCalledWith({ type: "SET_PAYMENT_METHOD", method: "wallet" });
  });

  it("blocks confirm when the Beezie wallet cannot cover the total", async () => {
    const user = userEvent.setup();
    const props = setup({ wallet: { balance: 100, points: 0 } });
    await user.click(screen.getByRole("button", { name: "Confirm" }));
    expect(props.onConfirm).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/not enough balance/i);
  });

  it("closes via the X and surfaces server errors", async () => {
    const user = userEvent.setup();
    const props = setup({ error: "Something went wrong" });
    expect(screen.getByRole("alert")).toHaveTextContent("Something went wrong");
    await user.click(screen.getByRole("button", { name: "Close" }));
    expect(props.dispatch).toHaveBeenCalledWith({ type: "CLOSE" });
  });
});
