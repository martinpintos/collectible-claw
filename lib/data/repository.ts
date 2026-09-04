import "server-only";
import { tierForValue } from "@/lib/domain/odds";
import type {
  CatalogItem,
  Machine,
  PullResult,
  RecentPull,
  TopItem,
} from "@/lib/domain/types";
import { resolveCardImage } from "./card-art";
import { CATALOG, findCatalogEntry } from "./catalog";
import { DEFAULT_MACHINE_SLUG, MACHINES, findMachine } from "./machines";
import { SEED_RECENT_PULLS } from "./recent-pulls";

/**
 * Mock data-access layer. Everything here is server-only and asynchronous so the
 * page can stream the slower sections through <Suspense>. The small artificial
 * latencies make that streaming visible when running locally.
 */
const LATENCY = {
  machine: 0,
  catalog: 0,
  topItems: 350,
  recentPulls: 600,
} as const;

function delay(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getMachines(): Promise<Machine[]> {
  await delay(LATENCY.machine);
  return MACHINES;
}

export async function getMachine(slug: string = DEFAULT_MACHINE_SLUG): Promise<Machine | null> {
  await delay(LATENCY.machine);
  return findMachine(slug) ?? null;
}

function toCatalogItem(machine: Machine, entryId: string): CatalogItem | null {
  const entry = findCatalogEntry(entryId);
  if (!entry) return null;
  const tier = tierForValue(machine.tiers, entry.marketValue);
  if (!tier) return null;
  return { ...entry, machineId: machine.id, tier, imageSrc: resolveCardImage(entry.id) };
}

/** Items a machine can dispense, with machine-specific tier and resolved artwork. */
export async function getCatalog(machine: Machine): Promise<CatalogItem[]> {
  await delay(LATENCY.catalog);
  return CATALOG.map((entry) => toCatalogItem(machine, entry.id)).filter(
    (item): item is CatalogItem => item !== null,
  );
}

export async function getTopItems(machine: Machine, limit = 12): Promise<TopItem[]> {
  const catalog = await getCatalog(machine);
  await delay(LATENCY.topItems);
  return [...catalog]
    .sort((a, b) => b.marketValue - a.marketValue)
    .slice(0, limit)
    .map((item) => ({
      id: item.id,
      name: item.name,
      grade: item.grade,
      grader: item.grader,
      fmv: item.marketValue,
      tier: item.tier,
      imageSrc: item.imageSrc,
    }));
}

/** A handful of mid/high-tier items to tease in the "What you can pull" carousel. */
export async function getCatalogPreview(machine: Machine, limit = 8): Promise<CatalogItem[]> {
  const catalog = await getCatalog(machine);
  const byTier = new Map<string, CatalogItem[]>();
  for (const item of catalog) {
    byTier.set(item.tier, [...(byTier.get(item.tier) ?? []), item]);
  }
  const picks: CatalogItem[] = [];
  for (const tier of ["ultra", "rare", "uncommon", "common"] as const) {
    // Photographed slabs sell the machine better than placeholders, so they win ties.
    const bucket = (byTier.get(tier) ?? []).sort(
      (a, b) => Number(!!b.imageSrc) - Number(!!a.imageSrc) || b.marketValue - a.marketValue,
    );
    picks.push(...bucket.slice(0, 2));
  }
  return picks.slice(0, limit);
}

/* ---------------------------------------------------------------------------
 * In-memory state (pulls + recent feed). Attached to globalThis so it survives
 * HMR in `next dev`. Resets on server restart — documented as mock behaviour.
 * ------------------------------------------------------------------------- */
type MemoryStore = {
  pulls: Map<string, PullResult & { swappedIds: Set<string> }>;
  recentPulls: RecentPull[];
};

declare global {
  var __clawMemoryStore: MemoryStore | undefined;
}

function seedRecentPulls(): RecentPull[] {
  const now = Date.now();
  return SEED_RECENT_PULLS.flatMap((seed, index) => {
    const entry = findCatalogEntry(seed.itemId);
    if (!entry) return [];
    return [
      {
        id: `seed_${index}`,
        itemId: entry.id,
        itemName: entry.name,
        user: seed.user,
        price: entry.marketValue,
        imageSrc: resolveCardImage(entry.id),
        at: new Date(now - seed.minutesAgo * 60_000).toISOString(),
      },
    ];
  });
}

function memory(): MemoryStore {
  if (!globalThis.__clawMemoryStore) {
    globalThis.__clawMemoryStore = { pulls: new Map(), recentPulls: seedRecentPulls() };
  }
  return globalThis.__clawMemoryStore;
}

export async function getRecentPulls(limit = 12): Promise<RecentPull[]> {
  await delay(LATENCY.recentPulls);
  return memory().recentPulls.slice(0, limit);
}

export function recordRecentPull(pull: RecentPull): void {
  const feed = memory().recentPulls;
  feed.unshift(pull);
  if (feed.length > 50) feed.length = 50;
}

export function savePull(pull: PullResult): void {
  memory().pulls.set(pull.pullId, { ...pull, swappedIds: new Set() });
}

export function getPull(pullId: string): (PullResult & { swappedIds: Set<string> }) | null {
  return memory().pulls.get(pullId) ?? null;
}

export function markSwapped(pullId: string, itemIds: string[]): void {
  const pull = memory().pulls.get(pullId);
  if (!pull) return;
  for (const id of itemIds) pull.swappedIds.add(id);
}

/** Test helper – wipes the in-memory store. */
export function __resetMemoryStore(): void {
  globalThis.__clawMemoryStore = undefined;
}
