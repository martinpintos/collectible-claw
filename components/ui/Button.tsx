"use client";

import { LoaderCircle } from "lucide-react";
import { motion, type HTMLMotionProps } from "motion/react";
import { forwardRef, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "brand" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: Variant;
  size?: Size;
  pending?: boolean;
  fullWidth?: boolean;
  children?: ReactNode;
}

const variants: Record<Variant, string> = {
  brand:
    "bg-brand text-brand-fg hover:brightness-105 disabled:bg-brand/45 disabled:text-brand-fg/70",
  secondary:
    "bg-control text-fg-secondary border border-border hover:text-fg hover:border-control-border disabled:opacity-50",
  ghost: "bg-transparent text-fg-secondary hover:text-fg hover:bg-white/5 disabled:opacity-50",
  outline:
    "bg-transparent text-fg border border-border hover:border-control-border disabled:opacity-50",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-[13px] rounded-input",
  md: "h-11 px-4 text-sm rounded-input",
  lg: "h-12 px-5 text-[15px] rounded-input",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "brand", size = "md", pending = false, fullWidth, className, children, disabled, ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type="button"
      whileTap={disabled || pending ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(
        "relative inline-flex select-none items-center justify-center gap-2 font-semibold outline-none transition-[color,background-color,border-color,filter] focus-visible:ring-2 focus-visible:ring-brand/70 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        className,
      )}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
      {...props}
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
      {children}
    </motion.button>
  );
});
