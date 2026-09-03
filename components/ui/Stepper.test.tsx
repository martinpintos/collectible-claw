import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Stepper } from "./Stepper";

describe("Stepper", () => {
  it("disables the bounds and reports changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(<Stepper value={1} max={3} onChange={onChange} />);

    const minus = screen.getByRole("button", { name: /decrease/i });
    const plus = screen.getByRole("button", { name: /increase/i });
    expect(minus).toBeDisabled();
    expect(plus).toBeEnabled();
    expect(screen.getByRole("status")).toHaveTextContent("1");

    await user.click(plus);
    expect(onChange).toHaveBeenCalledWith(2);

    rerender(<Stepper value={3} max={3} onChange={onChange} />);
    expect(screen.getByRole("button", { name: /increase/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /decrease/i })).toBeEnabled();
  });

  it("supports arrow keys on the group", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Stepper value={2} max={5} onChange={onChange} />);
    screen.getByRole("button", { name: /increase/i }).focus();
    await user.keyboard("{ArrowUp}");
    expect(onChange).toHaveBeenLastCalledWith(3);
    await user.keyboard("{ArrowDown}");
    expect(onChange).toHaveBeenLastCalledWith(1);
  });
});
