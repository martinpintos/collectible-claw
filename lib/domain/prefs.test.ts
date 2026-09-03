import { describe, expect, it } from "vitest";
import { DEFAULT_PREFS, parsePrefs, prefsCookieString, serializePrefs } from "./prefs";
import { DEFAULT_WALLET, parseWallet, serializeWallet } from "./wallet";

describe("prefs cookie", () => {
  it("round-trips", () => {
    const prefs = { sound: true, animation: false };
    expect(parsePrefs(serializePrefs(prefs))).toEqual(prefs);
  });
  it("falls back to defaults for missing or malformed values", () => {
    expect(parsePrefs(undefined)).toEqual(DEFAULT_PREFS);
    expect(parsePrefs("garbage")).toEqual(DEFAULT_PREFS);
    expect(parsePrefs("s2a1")).toEqual(DEFAULT_PREFS);
  });
  it("produces a Set-Cookie compatible string", () => {
    expect(prefsCookieString({ sound: true, animation: true })).toMatch(/^cc_prefs=s1a1; Path=\/; Max-Age=\d+; SameSite=Lax$/);
  });
});

describe("wallet cookie", () => {
  it("round-trips", () => {
    const wallet = { balance: 2400.5, points: 100 };
    expect(parseWallet(serializeWallet(wallet))).toEqual(wallet);
  });
  it("falls back to defaults and clamps negatives", () => {
    expect(parseWallet(undefined)).toEqual(DEFAULT_WALLET);
    expect(parseWallet("{not json")).toEqual(DEFAULT_WALLET);
    expect(parseWallet(JSON.stringify({ b: -5, p: -1 }))).toEqual({ balance: 0, points: 0 });
    expect(parseWallet(JSON.stringify({ b: "abc", p: 1 }))).toEqual(DEFAULT_WALLET);
  });
});
