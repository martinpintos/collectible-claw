import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_WALLET, WALLET_COOKIE, serializeWallet } from "@/lib/domain/wallet";

// In-memory cookie jar standing in for next/headers.
const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
    set: (name: string, value: string) => {
      jar.set(name, value);
    },
  }),
}));

vi.mock("next/cache", () => ({ refresh: () => {} }));

const { applyPromo, pullFromMachine, swapItems } = await import("./actions");
const { __resetMemoryStore } = await import("@/lib/data/repository");
const { SWAP_TICKET_COOKIE, parseSwapTickets, serializeSwapTickets } = await import(
  "@/lib/domain/swap-ticket"
);

beforeEach(() => {
  jar.clear();
  __resetMemoryStore();
});

describe("applyPromo", () => {
  it("accepts known codes case-insensitively and rejects unknown ones", async () => {
    const ok = await applyPromo({ code: " beezie10 " });
    expect(ok).toMatchObject({ ok: true, data: { code: "BEEZIE10", discountPct: 10 } });
    const bad = await applyPromo({ code: "NOPE" });
    expect(bad).toMatchObject({ ok: false, code: "INVALID_PROMO" });
    const empty = await applyPromo({ code: "" });
    expect(empty).toMatchObject({ ok: false, code: "INVALID_INPUT" });
  });
});

describe("pullFromMachine", () => {
  it("rejects malformed input", async () => {
    expect(await pullFromMachine({ machineSlug: "solana-claw", quantity: 0, paymentMethod: "wallet" })).toMatchObject({ ok: false, code: "INVALID_INPUT" });
    expect(await pullFromMachine({ machineSlug: "solana-claw", quantity: 11, paymentMethod: "wallet" })).toMatchObject({ ok: false, code: "INVALID_INPUT" });
    expect(await pullFromMachine(null)).toMatchObject({ ok: false, code: "INVALID_INPUT" });
  });

  it("404s unknown machines", async () => {
    expect(await pullFromMachine({ machineSlug: "nope", quantity: 1, paymentMethod: "wallet" })).toMatchObject({ ok: false, code: "NOT_FOUND" });
  });

  it("refuses when the Beezie wallet cannot cover the total", async () => {
    jar.set(WALLET_COOKIE, serializeWallet({ balance: 50, points: 0 }));
    const result = await pullFromMachine({ machineSlug: "solana-claw", quantity: 1, paymentMethod: "wallet", wallet: "beezie" });
    expect(result).toMatchObject({ ok: false, code: "INSUFFICIENT_FUNDS" });
  });

  it("draws the requested quantity, debits the wallet and persists the pull", async () => {
    const result = await pullFromMachine({ machineSlug: "solana-claw", quantity: 3, promoCode: "BEEZIE10", paymentMethod: "wallet", wallet: "beezie" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const pull = result.data;
    expect(pull.items).toHaveLength(3);
    expect(new Set(pull.items.map((i) => i.instanceId)).size).toBe(3);
    expect(pull.totalPaid).toBe(270);
    expect(pull.discount).toBe(30);
    expect(pull.pointsEarned).toBe(300);
    expect(pull.wallet.balance).toBe(DEFAULT_WALLET.balance - 270);
    expect(pull.wallet.points).toBe(300);
    for (const item of pull.items) {
      expect(item.swapValue).toBeCloseTo(item.marketValue * 0.85, 2);
    }
    expect(jar.get(WALLET_COOKIE)).toBe(serializeWallet(pull.wallet));
    const [ticket] = parseSwapTickets(jar.get(SWAP_TICKET_COOKIE));
    expect(ticket.pullId).toBe(pull.pullId);
    expect(Object.keys(ticket.values)).toHaveLength(3);
  });

  it("refuses the view-only external wallet", async () => {
    const result = await pullFromMachine({ machineSlug: "solana-claw", quantity: 1, paymentMethod: "wallet", wallet: "external" });
    expect(result).toMatchObject({ ok: false, code: "INSUFFICIENT_FUNDS" });
    expect(jar.get(WALLET_COOKIE)).toBeUndefined();
  });

  it("does not debit the wallet when paying by card", async () => {
    const result = await pullFromMachine({ machineSlug: "wildcard", quantity: 2, paymentMethod: "card" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.data.wallet.balance).toBe(DEFAULT_WALLET.balance);
    expect(result.data.wallet.points).toBe(60);
  });
});

describe("swapItems", () => {
  async function pull(quantity: number) {
    const result = await pullFromMachine({ machineSlug: "solana-claw", quantity, paymentMethod: "wallet", wallet: "beezie" });
    if (!result.ok) throw new Error(result.error);
    return result.data;
  }

  it("credits the server-computed swap value and points", async () => {
    const p = await pull(2);
    const ids = p.items.map((i) => i.instanceId);
    const result = await swapItems({ pullId: p.pullId, itemIds: ids });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const expected = Math.round(p.items.reduce((s, i) => s + i.swapValue, 0) * 100) / 100;
    expect(result.data.credited).toBe(expected);
    expect(result.data.points).toBe(Math.round(expected * 1.6));
    expect(result.data.wallet.balance).toBeCloseTo(p.wallet.balance + expected, 2);
    expect(result.data.swappedItemIds).toEqual(ids);
  });

  it("survives a server instance that never saw the pull", async () => {
    const p = await pull(1);
    // The swap ticket lives in the cookie jar, so a fresh process still honours it.
    __resetMemoryStore();
    expect(await swapItems({ pullId: p.pullId, itemIds: [p.items[0].instanceId] })).toMatchObject({
      ok: true,
    });
  });

  it("rejects a tampered ticket", async () => {
    const p = await pull(1);
    const [body, signature] = jar.get(SWAP_TICKET_COOKIE)!.split(".");
    const forged = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    forged[0].v[p.items[0].instanceId] = 999_999;
    const tampered = `${Buffer.from(JSON.stringify(forged)).toString("base64url")}.${signature}`;
    jar.set(SWAP_TICKET_COOKIE, tampered);
    expect(await swapItems({ pullId: p.pullId, itemIds: [p.items[0].instanceId] })).toMatchObject({
      ok: false,
      code: "NOT_FOUND",
    });
  });

  it("keeps an earlier offer swappable after another pull", async () => {
    const first = await pull(1);
    await pull(1);
    expect(
      await swapItems({ pullId: first.pullId, itemIds: [first.items[0].instanceId] }),
    ).toMatchObject({ ok: true });
  });

  it("credits every selected item in one multi-item swap, once", async () => {
    const p = await pull(4);
    const ids = p.items.map((i) => i.instanceId);
    const first = await swapItems({ pullId: p.pullId, itemIds: [ids[0], ids[1], ids[0]] });
    expect(first).toMatchObject({ ok: true });
    if (!first.ok) return;
    const expected =
      Math.round((p.items[0].swapValue + p.items[1].swapValue) * 100) / 100;
    expect(first.data.credited).toBe(expected);
    expect(first.data.swappedItemIds).toEqual([ids[0], ids[1]]);

    // The remaining two are still swappable; the first two are not.
    expect(await swapItems({ pullId: p.pullId, itemIds: [ids[1], ids[2]] })).toMatchObject({
      ok: false,
      code: "INVALID_INPUT",
    });
    const second = await swapItems({ pullId: p.pullId, itemIds: [ids[2], ids[3]] });
    expect(second).toMatchObject({ ok: true });
    if (!second.ok) return;
    expect(second.data.credited).toBe(
      Math.round((p.items[2].swapValue + p.items[3].swapValue) * 100) / 100,
    );
  });

  it("rejects ids that are not part of the pull, double swaps and unknown pulls", async () => {
    const p = await pull(1);
    expect(await swapItems({ pullId: p.pullId, itemIds: ["not-mine"] })).toMatchObject({ ok: false, code: "INVALID_INPUT" });
    expect(await swapItems({ pullId: crypto.randomUUID(), itemIds: [p.items[0].instanceId] })).toMatchObject({ ok: false, code: "NOT_FOUND" });
    expect((await swapItems({ pullId: p.pullId, itemIds: [p.items[0].instanceId] })).ok).toBe(true);
    expect(await swapItems({ pullId: p.pullId, itemIds: [p.items[0].instanceId] })).toMatchObject({ ok: false, code: "INVALID_INPUT" });
  });

  it("rejects expired offers", async () => {
    const p = await pull(1);
    const [ticket] = parseSwapTickets(jar.get(SWAP_TICKET_COOKIE));
    jar.set(
      SWAP_TICKET_COOKIE,
      serializeSwapTickets([{ ...ticket, expiresAt: new Date(Date.now() - 1000).toISOString() }]),
    );
    expect(await swapItems({ pullId: p.pullId, itemIds: [p.items[0].instanceId] })).toMatchObject({ ok: false, code: "EXPIRED" });
  });
});
