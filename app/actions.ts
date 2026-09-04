"use server";

import { refresh } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { getCatalog, getMachine, recordRecentPull } from "@/lib/data/repository";
import { findPromo, normalizePromoCode } from "@/lib/data/promos";
import { drawItems } from "@/lib/domain/draw";
import { SWAP_WINDOW_MS, priceFor, round2, swapPoints, swapValue } from "@/lib/domain/pricing";
import { secureRng } from "@/lib/domain/rng";
import {
  SWAP_TICKET_COOKIE,
  type SwapTicket,
  parseSwapTickets,
  serializeSwapTickets,
  ticketFromPull,
  withTicket,
} from "@/lib/domain/swap-ticket";
import type {
  ActionErrorCode,
  ActionResult,
  Promo,
  PullResult,
  PulledItem,
  SwapResult,
  WalletSnapshot,
} from "@/lib/domain/types";
import { WALLET_COOKIE, WALLET_MAX_AGE, parseWallet, serializeWallet } from "@/lib/domain/wallet";

const pullInput = z.object({
  machineSlug: z.string().min(1).max(64),
  quantity: z.number().int().min(1).max(10),
  promoCode: z.string().trim().max(20).optional(),
  paymentMethod: z.enum(["wallet", "card"]),
  wallet: z.enum(["beezie", "external"]).optional(),
});

const swapInput = z.object({
  pullId: z.string().uuid(),
  itemIds: z.array(z.string().min(1).max(64)).min(1).max(10),
});

const promoInput = z.object({ code: z.string().trim().min(1).max(20) });

async function readWallet(): Promise<WalletSnapshot> {
  const store = await cookies();
  return parseWallet(store.get(WALLET_COOKIE)?.value);
}

/**
 * Persist the balance *and* refresh the router: the header chip and the payment
 * modal are server-rendered from this cookie, so without the refresh a debit or
 * a swap credit would only show up after a manual reload.
 */
async function writeWallet(wallet: WalletSnapshot): Promise<void> {
  const store = await cookies();
  store.set(WALLET_COOKIE, serializeWallet(wallet), {
    path: "/",
    maxAge: WALLET_MAX_AGE,
    sameSite: "lax",
  });
  refresh();
}

async function readSwapTickets(): Promise<SwapTicket[]> {
  const store = await cookies();
  return parseSwapTickets(store.get(SWAP_TICKET_COOKIE)?.value);
}

/**
 * Add or replace one offer. The cookie is short-lived like the offer itself and
 * HttpOnly because only the server ever reads it back.
 */
async function writeSwapTicket(ticket: SwapTicket, existing: SwapTicket[]): Promise<void> {
  const store = await cookies();
  store.set(SWAP_TICKET_COOKIE, serializeSwapTickets(withTicket(existing, ticket)), {
    path: "/",
    maxAge: Math.ceil(SWAP_WINDOW_MS / 1000),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

function fail<T>(code: ActionErrorCode, error: string): ActionResult<T> {
  return { ok: false, code, error };
}

export async function applyPromo(raw: unknown): Promise<ActionResult<Promo>> {
  const parsed = promoInput.safeParse(raw);
  if (!parsed.success) return fail("INVALID_INPUT", "Enter a promo code.");
  const promo = findPromo(parsed.data.code);
  if (!promo)
    return fail("INVALID_PROMO", `"${normalizePromoCode(parsed.data.code)}" is not a valid code.`);
  return { ok: true, data: promo };
}

/**
 * Resolve a pull on the server: validate, price, debit the (mock) wallet, draw
 * with a CSPRNG and persist the result so the swap step can trust it.
 */
export async function pullFromMachine(raw: unknown): Promise<ActionResult<PullResult>> {
  const parsed = pullInput.safeParse(raw);
  if (!parsed.success) return fail("INVALID_INPUT", "That request doesn't look right.");
  const input = parsed.data;

  const machine = await getMachine(input.machineSlug);
  if (!machine) return fail("NOT_FOUND", "Machine not found.");

  const promo = input.promoCode ? (findPromo(input.promoCode) ?? null) : null;
  const quote = priceFor(machine, input.quantity, promo);

  const wallet = await readWallet();
  if (input.paymentMethod === "wallet") {
    if (input.wallet === "external") {
      return fail(
        "INSUFFICIENT_FUNDS",
        "External wallet is view-only in this demo. Use your Beezie wallet.",
      );
    }
    if (wallet.balance < quote.total) {
      return fail("INSUFFICIENT_FUNDS", "Not enough balance in your Beezie wallet.");
    }
  }

  const catalog = await getCatalog(machine);
  const drawn = drawItems(machine.tiers, catalog, quote.quantity, secureRng());
  const items: PulledItem[] = drawn.map((item) => ({
    ...item,
    instanceId: crypto.randomUUID(),
    swapValue: swapValue(item.marketValue, machine.swapPct),
  }));

  const nextWallet: WalletSnapshot = {
    balance:
      input.paymentMethod === "wallet" ? round2(wallet.balance - quote.total) : wallet.balance,
    points: wallet.points + quote.points,
  };

  const pull: PullResult = {
    pullId: crypto.randomUUID(),
    machineSlug: machine.slug,
    quantity: quote.quantity,
    items,
    unitPrice: quote.unitPrice,
    discount: quote.discount,
    totalPaid: quote.total,
    pointsEarned: quote.points,
    wallet: nextWallet,
    expiresAt: new Date(Date.now() + SWAP_WINDOW_MS).toISOString(),
  };

  await writeSwapTicket(ticketFromPull(pull), await readSwapTickets());
  for (const item of items) {
    recordRecentPull({
      id: item.instanceId,
      itemId: item.id,
      itemName: item.name,
      user: "Martin",
      price: item.marketValue,
      imageSrc: item.imageSrc,
      at: new Date().toISOString(),
    });
  }
  await writeWallet(nextWallet);
  return { ok: true, data: pull };
}

/** Swap one or more items from an open offer. Values are recomputed server-side. */
export async function swapItems(raw: unknown): Promise<ActionResult<SwapResult>> {
  const parsed = swapInput.safeParse(raw);
  if (!parsed.success) return fail("INVALID_INPUT", "That request doesn't look right.");
  const { pullId, itemIds } = parsed.data;

  const tickets = await readSwapTickets();
  const ticket = tickets.find((entry) => entry.pullId === pullId);
  if (!ticket) return fail("NOT_FOUND", "This pull has expired. Please pull again.");
  const expiresAt = Date.parse(ticket.expiresAt);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt)
    return fail("EXPIRED", "The swap offer has expired.");

  const unique = [...new Set(itemIds)];
  const values = unique.map((id) => ticket.values[id]);
  if (values.some((value) => value === undefined))
    return fail("INVALID_INPUT", "One of those items isn't part of this pull.");
  if (unique.some((id) => ticket.swappedIds.includes(id)))
    return fail("INVALID_INPUT", "Item already swapped.");

  const credited = round2(values.reduce((sum, value) => sum + value, 0));
  const points = swapPoints(credited);
  const wallet = await readWallet();
  const nextWallet: WalletSnapshot = {
    balance: round2(wallet.balance + credited),
    points: wallet.points + points,
  };

  await writeSwapTicket({ ...ticket, swappedIds: [...ticket.swappedIds, ...unique] }, tickets);
  await writeWallet(nextWallet);
  return {
    ok: true,
    data: { pullId, swappedItemIds: unique, credited, points, wallet: nextWallet },
  };
}
