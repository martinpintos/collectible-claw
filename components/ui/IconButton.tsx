"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface IconButtonProps extends HTMLMotionProps<"button"> {
  label: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, className, children, ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      whileTap={{ scale: 0.92 }}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-full text-fg-secondary outline-none transition-colors hover:bg-white/10 hover:text-fg focus-visible:ring-2 focus-visible:ring-brand/70 disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
});
