let locks = 0;

/**
 * Hide the page scrollbar while an overlay is open without moving the content
 * underneath it.
 *
 * `scrollbar-gutter: stable` keeps the gutter reserved on engines that support
 * it, and there the measured gap is 0. Where it is not honoured (older Safari,
 * and any engine that drops the gutter once `overflow` becomes `hidden`) the
 * viewport widens by the scrollbar width the moment the lock lands, so that
 * exact amount is measured and given back as padding. `--scroll-lock-gap` lets
 * fixed-position bars, which the padding cannot reach, compensate too.
 *
 * Refcounted: nested overlays (a lightbox above the flow) each hold one lock and
 * the page only unlocks when the last one is released. The returned release
 * function is idempotent.
 */
export function lockScroll(): () => void {
  if (typeof document === "undefined") return () => {};
  const html = document.documentElement;

  if (locks === 0) {
    const widthBefore = html.clientWidth;
    html.classList.add("scroll-locked");
    const gap = html.clientWidth - widthBefore;
    if (gap > 0) {
      html.style.setProperty("--scroll-lock-gap", `${gap}px`);
      html.style.paddingRight = `${gap}px`;
    }
  }
  locks += 1;

  let released = false;
  return () => {
    if (released) return;
    released = true;
    locks -= 1;
    if (locks === 0) {
      html.classList.remove("scroll-locked");
      html.style.paddingRight = "";
      html.style.removeProperty("--scroll-lock-gap");
    }
  };
}
