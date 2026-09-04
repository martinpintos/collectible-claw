import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { OddsInfo } from "./OddsInfo";

describe("OddsInfo", () => {
  it("opens the explainer dialog from the ? affordance and closes it again", async () => {
    const user = userEvent.setup();
    render(<OddsInfo />);

    expect(screen.queryByRole("heading", { name: "Odds" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /how odds work/i }));

    expect(screen.getByRole("heading", { name: "Odds" })).toBeInTheDocument();
    expect(screen.getByText("Fair market value")).toBeInTheDocument();
    expect(screen.getByText("Real-time")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Close" }));

    // The dialog stays mounted until its exit animation finishes.
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Odds" })).not.toBeInTheDocument(),
    );
  });
});
