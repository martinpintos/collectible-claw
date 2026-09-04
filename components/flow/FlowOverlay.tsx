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
  onRequestClose,
  children,
  label,
}: {
  open: boolean;
  onRequestClose: () => void;
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
          className={cn("fixed inset-0 z-50 outline-none")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          transition={{ duration: 0.25 }}
        >
          <div className="absolute inset-0 bg-black/75 backdrop-blur-[3px]" onClick={onRequestClose} />
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
