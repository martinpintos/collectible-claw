import { describe, expect, it } from "vitest";
import { formatCountdown, money, pointsLabel, valueRange } from "./format";

describe("money", () => {
  it("drops cents for whole amounts", () => {
    expect(money(14200)).toBe("$14,200");
    expect(money(30)).toBe("$30");
  });
  it("keeps cents when present or forced", () => {
    expect(money(42.3)).toBe("$42.30");
    expect(money(100, { cents: true })).toBe("$100.00");
  });
});

describe("formatCountdown", () => {
  it("renders minutes and seconds", () => {
    expect(formatCountdown(869_000)).toBe("14 min 29 sec");
    expect(formatCountdown(59_999)).toBe("0 min 59 sec");
  });
  it("clamps at zero", () => {
    expect(formatCountdown(0)).toBe("0 min 0 sec");
    expect(formatCountdown(-5000)).toBe("0 min 0 sec");
  });
});

describe("labels", () => {
  it("formats value ranges like the odds grid", () => {
    expect(valueRange(8001, null)).toBe("$8,001+");
    expect(valueRange(501, 1500)).toBe("$501 - $1,500");
  });
  it("pluralises points", () => {
    expect(pointsLabel(250)).toBe("+250 points");
    expect(pointsLabel(1)).toBe("+1 point");
  });
});
