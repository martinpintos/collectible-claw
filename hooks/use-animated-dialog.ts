"use client";

import { useCallback, useEffect, useRef, type SyntheticEvent } from "react";
import { lockScroll } from "@/lib/utils/scroll-lock";

/**
 * Drives a native <dialog> that animates both ways.
 *
 * `dialog.close()` removes the element from the top layer immediately, which
 * would cut any exit animation short, so the element is kept open until the
 * content has finished animating out (`handleExitComplete`, wired to
 * AnimatePresence). Escape is intercepted for the same reason: the browser's
 * default cancel closes instantly.
 */
export function useAnimatedDialog(open: boolean, onRequestClose: () => void) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const releaseScroll = useRef<(() => void) | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;
    if (!dialog.open) dialog.showModal();
    releaseScroll.current ??= lockScroll();
  }, [open]);

  // An unmount mid-animation still has to give the page its scrollbar back.
  useEffect(
    () => () => {
      releaseScroll.current?.();
      releaseScroll.current = null;
    },
    [],
  );

  const finish = useCallback(() => {
    const dialog = dialogRef.current;
    if (dialog?.open) dialog.close();
    releaseScroll.current?.();
    releaseScroll.current = null;
  }, []);

  // Safety net: a hidden tab pauses rAF, so the exit animation may never report
  // back. Close on a timer rather than leaving the page stuck under a dialog.
  useEffect(() => {
    if (open) return;
    const timer = setTimeout(finish, 600);
    return () => clearTimeout(timer);
  }, [open, finish]);

  const handleCancel = useCallback(
    (event: SyntheticEvent<HTMLDialogElement>) => {
      event.preventDefault();
      onRequestClose();
    },
    [onRequestClose],
  );

  return { dialogRef, handleExitComplete: finish, handleCancel };
}
