import { afterEach, describe, expect, it, vi } from "vitest";
import { tierForValue } from "@/lib/domain/odds";
import { findMachine } from "./machines";
import {
  __resetMemoryStore,
  getCatalog,
  getCatalogPreview,
  getRecentPulls,
  getTopItems,
  recordRecentPull,
} from "./repository";

const solana = findMachine("solana-claw")!;

afterEach(() => {
  vi.useRealTimers();
  __resetMemoryStore();
});

describe("repository catalog queries", () => {
  it("returns only machine-eligible items with their resolved tier and artwork", async () => {
    const catalog = await getCatalog(solana);

    expect(catalog).not.toHaveLength(0);
    expect(catalog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "poncho-pikachu-231",
          machineId: solana.id,
          tier: "ultra",
          imageSrc: "/cards/poncho-pikachu-231.jpg",
        }),
      ]),
    );
    for (const item of catalog) {
      expect(item.machineId).toBe(solana.id);
      expect(tierForValue(solana.tiers, item.marketValue)).toBe(item.tier);
    }
  });

  it("sorts top items by market value and applies the requested limit", async () => {
    vi.useFakeTimers();
    const topItems = getTopItems(solana, 3);
    await vi.advanceTimersByTimeAsync(350);

    expect(await topItems).toMatchObject([
      { id: "shadowless-charizard-1st-psa8", fmv: 25_000 },
      { id: "poncho-pikachu-231", fmv: 14_200 },
      { id: "skyridge-charizard-146", fmv: 12_000 },
    ]);
  });

  it("builds a balanced preview while preferring photographed items within a tier", async () => {
    const preview = await getCatalogPreview(solana);
    const ultraItems = preview.filter((item) => item.tier === "ultra");

    expect(preview).toHaveLength(8);
    expect(preview.filter((item) => item.tier === "base")).toHaveLength(0);
    expect(ultraItems.map((item) => item.id)).toEqual([
      "poncho-pikachu-231",
      "shadowless-charizard-1st-psa8",
    ]);
    for (const tier of ["ultra", "rare", "uncommon", "common"] as const) {
      expect(preview.filter((item) => item.tier === tier)).toHaveLength(2);
    }
  });
});

describe("repository recent pulls", () => {
  it("prepends recorded pulls and honors the requested feed limit", async () => {
    vi.useFakeTimers();
    recordRecentPull({
      id: "pull_latest",
      itemId: "poncho-pikachu-231",
      itemName: "Poncho Wear Pikachu",
      user: "test collector",
      price: 14_200,
      imageSrc: "/cards/poncho-pikachu-231.jpg",
      at: "2026-09-03T12:00:00.000Z",
    });
    const recentPulls = getRecentPulls(1);
    await vi.advanceTimersByTimeAsync(600);

    await expect(recentPulls).resolves.toEqual([
      expect.objectContaining({ id: "pull_latest", user: "test collector" }),
    ]);
  });
});
