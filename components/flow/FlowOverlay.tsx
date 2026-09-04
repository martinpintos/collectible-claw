"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import { lockScroll } from "@/lib/utils/scroll-lock";
import { cn } from "@/lib/utils/cn";

/**
 * Fullscreen overlay shell for the pull flow. It is a custom dialog (not
 * <dialog>.showModal()) so the page can be made inert without also disabling
 * the haptics helper element web-haptics mounts on <body>.
 */
export function FlowOverlay({
  open,
  closing,
  onRequestClose,
  onCloseAnimationComplete,
  children,
  label,
}: {
  open: boolean;
  closing: boolean;
  onRequestClose: () => void;
  onCloseAnimationComplete: () => void;
  children: ReactNode;
  label: string;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const lastFocused = useRef<Element | null>(null);

  // Scroll lock + make the page behind inert while the flow is open.
  useLayoutEffect(() => {
    if (!open) return;
    const root = document.getElementById("page-root");
    lastFocused.current = document.activeElement;
    const releaseScroll = lockScroll();
    root?.setAttribute("inert", "");
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      releaseScroll();
      root?.removeAttribute("inert");
      if (lastFocused.current instanceof HTMLElement) {
        lastFocused.current.focus({ preventScroll: true });
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onRequestClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onRequestClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="flow-overlay"
          ref={panelRef}
          tabIndex={-1}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          className={cn("fixed inset-0 z-50 outline-none", closing && "pointer-events-none")}
          initial={false}
          // Each layer runs its own exit (the panel leads, the backdrop and its
          // blur follow), so the container itself never fades — that would flatten
          // the whole dismissal into one abrupt cut. The unmount lands after the
          // backdrop reports its animation complete.
          exit={{ opacity: 0, transition: { duration: 0.01 } }}
        >
          <motion.div
            className="absolute inset-0 bg-black/75"
            initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
            // Releasing the blur on the way out mirrors the entrance instead of
            // snapping the page back into focus.
            animate={{
              opacity: closing ? 0 : 1,
              backdropFilter: closing ? "blur(0px)" : "blur(10px)",
            }}
            transition={{
              duration: closing ? 0.32 : 0.24,
              ease: closing ? [0.4, 0, 0.2, 1] : [0.22, 1, 0.36, 1],
            }}
            onAnimationComplete={() => {
              if (closing) onCloseAnimationComplete();
            }}
            onClick={onRequestClose}
          />
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
