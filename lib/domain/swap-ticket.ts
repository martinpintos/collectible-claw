import { createHmac, timingSafeEqual } from "node:crypto";
import type { PullResult } from "./types";

/**
 * The swap offer as a signed cookie.
 *
 * The pull used to live in server memory, which breaks the moment the swap
 * Server Action lands on a different instance than the pull did (every
 * serverless deploy). The ticket travels with the browser instead and carries
 * only what the swap needs to be recomputed server-side — the item values are
 * signed, so the client still cannot invent a credit.
 *
 * The cookie holds a small jar rather than a single ticket: pulling again (or
 * from a second tab) must not invalidate an offer that is still on screen.
 */
export const SWAP_TICKET_COOKIE = "cc_pull";

export interface SwapTicket {
  pullId: string;
  expiresAt: string;
  /** Server-computed swap value per pulled item, keyed by instance id. */
  values: Record<string, number>;
  swappedIds: string[];
}

/** Demo-grade default: a real deployment sets CLAW_SWAP_SECRET per environment. */
const SECRET = process.env.CLAW_SWAP_SECRET ?? "beezie-claw-demo-swap-secret";

/** Newest-first, and trimmed to stay well inside the 4 KB per-cookie budget. */
const MAX_TICKETS = 4;
const MAX_COOKIE_BYTES = 3_500;

function sign(body: string): string {
  return createHmac("sha256", SECRET).update(body).digest("base64url");
}

function signatureMatches(body: string, signature: string): boolean {
  const expected = Buffer.from(sign(body));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function ticketFromPull(pull: PullResult): SwapTicket {
  return {
    pullId: pull.pullId,
    expiresAt: pull.expiresAt,
    values: Object.fromEntries(pull.items.map((item) => [item.instanceId, item.swapValue])),
    swappedIds: [],
  };
}

type EncodedTicket = { i: string; e: string; v: Record<string, number>; s: string[] };

function encode(tickets: SwapTicket[]): string {
  const payload: EncodedTicket[] = tickets.map((ticket) => ({
    i: ticket.pullId,
    e: ticket.expiresAt,
    v: ticket.values,
    s: ticket.swappedIds,
  }));
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodeTicket(entry: unknown): SwapTicket | null {
  if (!entry || typeof entry !== "object") return null;
  const { i, e, v, s } = entry as Partial<EncodedTicket>;
  if (typeof i !== "string" || typeof e !== "string") return null;
  if (!v || typeof v !== "object") return null;

  const values: Record<string, number> = {};
  for (const [id, value] of Object.entries(v as Record<string, unknown>)) {
    if (typeof value !== "number" || !Number.isFinite(value)) return null;
    values[id] = value;
  }
  const swappedIds = Array.isArray(s) ? s.filter((id): id is string => typeof id === "string") : [];
  return { pullId: i, expiresAt: e, values, swappedIds };
}

/**
 * Serialize newest-first, dropping the oldest offers until the cookie fits. An
 * offer that falls off the end simply cannot be swapped any more — the user is
 * told to pull again, which is the same thing an expired offer does.
 */
export function serializeSwapTickets(tickets: SwapTicket[]): string {
  let kept = tickets.slice(0, MAX_TICKETS);
  let body = encode(kept);
  while (kept.length > 1 && Buffer.byteLength(body) > MAX_COOKIE_BYTES) {
    kept = kept.slice(0, -1);
    body = encode(kept);
  }
  return `${body}.${sign(body)}`;
}

export function parseSwapTickets(raw: string | undefined | null): SwapTicket[] {
  if (!raw) return [];
  const separator = raw.lastIndexOf(".");
  if (separator <= 0) return [];
  const body = raw.slice(0, separator);
  if (!signatureMatches(body, raw.slice(separator + 1))) return [];

  try {
    const parsed: unknown = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!Array.isArray(parsed)) return [];
    return parsed.map(decodeTicket).filter((ticket): ticket is SwapTicket => ticket !== null);
  } catch {
    return [];
  }
}

/** Replace the offer with the same pull id, keeping newest-first order. */
export function withTicket(tickets: SwapTicket[], ticket: SwapTicket): SwapTicket[] {
  const rest = tickets.filter((entry) => entry.pullId !== ticket.pullId);
  return [ticket, ...rest];
}
