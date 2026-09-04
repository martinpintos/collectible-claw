import { describe, expect, it } from "vitest";
import {
  type SwapTicket,
  parseSwapTickets,
  serializeSwapTickets,
  withTicket,
} from "./swap-ticket";

function ticket(pullId: string, itemCount = 1): SwapTicket {
  return {
    pullId,
    expiresAt: new Date(Date.now() + 900_000).toISOString(),
    values: Object.fromEntries(
      Array.from({ length: itemCount }, (_, i) => [`${pullId}-item-${i}-${crypto.randomUUID()}`, 42.5]),
    ),
    swappedIds: [],
  };
}

describe("swap tickets", () => {
  it("round-trips a jar of offers", () => {
    const jar = [ticket("a", 3), ticket("b")];
    expect(parseSwapTickets(serializeSwapTickets(jar))).toEqual(jar);
  });

  it("returns nothing for a missing, malformed or tampered cookie", () => {
    expect(parseSwapTickets(undefined)).toEqual([]);
    expect(parseSwapTickets("not-a-ticket")).toEqual([]);
    const [body, signature] = serializeSwapTickets([ticket("a")]).split(".");
    expect(parseSwapTickets(`${body}x.${signature}`)).toEqual([]);
    expect(parseSwapTickets(`${body}.${signature.slice(0, -1)}`)).toEqual([]);
  });

  it("replaces an offer in place rather than duplicating it", () => {
    const original = ticket("a");
    const updated = { ...original, swappedIds: ["x"] };
    const jar = withTicket(withTicket([], original), updated);
    expect(jar).toEqual([updated]);
  });

  it("keeps the newest offers and stays inside the cookie budget", () => {
    const jar = Array.from({ length: 8 }, (_, i) => ticket(`pull-${i}`, 10));
    const cookie = serializeSwapTickets(jar);
    const parsed = parseSwapTickets(cookie);

    expect(Buffer.byteLength(cookie)).toBeLessThan(4096);
    expect(parsed.length).toBeGreaterThan(0);
    expect(parsed[0].pullId).toBe("pull-0");
    expect(parsed.map((t) => t.pullId)).toEqual(jar.slice(0, parsed.length).map((t) => t.pullId));
  });
});
