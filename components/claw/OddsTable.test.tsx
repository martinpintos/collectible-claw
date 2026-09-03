import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MACHINES } from "@/lib/data/machines";
import { OddsTable } from "./OddsTable";

describe("OddsTable (synchronous server component)", () => {
  it("renders the five tiers in order with odds, ranges and the average value", () => {
    const gold = MACHINES.find((m) => m.slug === "pokemon-gold-claw")!;
    render(<OddsTable tiers={gold.tiers} averageValue={505} />);
    const list = screen.getByRole("list", { name: /odds by rarity/i });
    const chips = within(list).getAllByRole("listitem");
    expect(chips).toHaveLength(5);
    expect(chips[0]).toHaveTextContent("Ultra-Rare");
    expect(chips[0]).toHaveTextContent("0.72%");
    expect(chips[0]).toHaveTextContent("$8,001+");
    expect(chips[4]).toHaveTextContent("Base");
    expect(chips[4]).toHaveTextContent("$250 - $500");
    expect(screen.getByText("$505")).toBeInTheDocument();
    expect(screen.getByText("Updates every few seconds.")).toBeInTheDocument();
  });
});
