import { afterEach, describe, expect, it, vi } from "vitest";
import { lockScroll } from "./scroll-lock";

const html = () => document.documentElement;

afterEach(() => {
  html().classList.remove("scroll-locked");
  html().style.paddingRight = "";
});

describe("lockScroll", () => {
  it("locks and unlocks the page", () => {
    const release = lockScroll();
    expect(html()).toHaveClass("scroll-locked");
    release();
    expect(html()).not.toHaveClass("scroll-locked");
  });

  it("stays locked until the last overlay releases", () => {
    const first = lockScroll();
    const second = lockScroll();
    first();
    expect(html()).toHaveClass("scroll-locked");
    second();
    expect(html()).not.toHaveClass("scroll-locked");
  });

  it("ignores a release that runs twice", () => {
    const first = lockScroll();
    const second = lockScroll();
    first();
    first();
    // The double release must not have dropped the second overlay's lock.
    expect(html()).toHaveClass("scroll-locked");
    second();
    expect(html()).not.toHaveClass("scroll-locked");
  });

  it("gives back the scrollbar width when the gutter is not reserved", () => {
    // jsdom has no layout, so stand in for an engine that widens the viewport
    // by 15px the moment `overflow: hidden` removes the scrollbar.
    const widths = vi
      .spyOn(document.documentElement, "clientWidth", "get")
      .mockImplementation(() => (html().classList.contains("scroll-locked") ? 1015 : 1000));

    const release = lockScroll();
    expect(html().style.paddingRight).toBe("15px");
    expect(html().style.getPropertyValue("--scroll-lock-gap")).toBe("15px");

    release();
    expect(html().style.paddingRight).toBe("");
    expect(html().style.getPropertyValue("--scroll-lock-gap")).toBe("");
    widths.mockRestore();
  });
});
