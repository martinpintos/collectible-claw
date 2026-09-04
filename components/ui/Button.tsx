"use client";

import { LoaderCircle } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  type HTMLMotionProps,
  type MotionValue,
} from "motion/react";
import {
  forwardRef,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "brand" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: Variant;
  size?: Size;
  pending?: boolean;
  fullWidth?: boolean;
  /** Charged hover treatment (orbiting edge, rising embers, press burst) for a screen's primary CTA. */
  glow?: boolean;
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

interface Burst {
  id: number;
  x: number;
  y: number;
}

/** Ring mask: paint the conic sweep only in a 1.5px band around the border. */
const RING_MASK: CSSProperties = {
  padding: 1.5,
  WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  WebkitMaskComposite: "xor",
  mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  maskComposite: "exclude",
};

const ORBIT =
  "conic-gradient(from 0deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0) 210deg, rgba(255,236,170,0.75) 288deg, rgba(255,255,255,1) 330deg, rgba(255,236,170,0.75) 348deg, rgba(255,255,255,0) 360deg)";

/** Fixed ember lanes — deterministic so render stays pure and SSR matches. */
const EMBERS = [
  { left: "10%", size: 3, delay: 0, duration: 1.9, rise: -30 },
  { left: "27%", size: 2, delay: 0.55, duration: 2.3, rise: -24 },
  { left: "43%", size: 2, delay: 0.2, duration: 2.05, rise: -34 },
  { left: "59%", size: 3, delay: 0.85, duration: 2.4, rise: -26 },
  { left: "74%", size: 2, delay: 0.4, duration: 2.15, rise: -32 },
  { left: "90%", size: 2, delay: 1.05, duration: 2.25, rise: -22 },
];

function EnergyLayers({ animated }: { animated: boolean }) {
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-[inherit]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
    >
      {/* Charge travelling counter-clockwise around the edge. */}
      <span className="absolute inset-0 overflow-hidden rounded-[inherit]" style={RING_MASK}>
        <motion.span
          className="absolute left-1/2 top-1/2 aspect-square w-[220%]"
          style={{ background: ORBIT, translateX: "-50%", translateY: "-50%" }}
          initial={{ rotate: 0 }}
          animate={animated ? { rotate: -360 } : { rotate: -90 }}
          transition={
            animated
              ? { duration: 2.6, ease: "linear", repeat: Infinity }
              : { duration: 0.3, ease: "easeOut" }
          }
        />
      </span>

      {/* Updraft from the base, so the charge feels like it is being fed from below. */}
      <motion.span
        className="absolute inset-x-0 bottom-0 h-1/2 rounded-b-[inherit] bg-gradient-to-t from-white/25 via-white/5 to-transparent"
        style={{ mixBlendMode: "plus-lighter" }}
        initial={{ opacity: 0.3 }}
        animate={animated ? { opacity: [0.25, 0.55, 0.25] } : { opacity: 0.3 }}
        transition={animated ? { duration: 1.8, ease: "easeInOut", repeat: Infinity } : undefined}
      />

      {animated
        ? EMBERS.map((ember) => (
            <motion.span
              key={ember.left}
              className="absolute bottom-0 rounded-full bg-white"
              style={{
                left: ember.left,
                width: ember.size,
                height: ember.size,
                mixBlendMode: "plus-lighter",
                boxShadow: "0 0 6px rgba(255,255,255,0.9)",
              }}
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: ember.rise, opacity: [0, 0.95, 0] }}
              transition={{
                duration: ember.duration,
                delay: ember.delay,
                ease: "easeOut",
                repeat: Infinity,
              }}
            />
          ))
        : null}
    </motion.span>
  );
}

function CursorBloom({ x, y, hot }: { x: MotionValue<number>; y: MotionValue<number>; hot: boolean }) {
  const highlight = useMotionTemplate`radial-gradient(190px circle at ${x}px ${y}px, rgba(255,255,255,0.62), rgba(255,236,170,0.3) 45%, rgba(255,255,255,0) 88%)`;
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ background: highlight, mixBlendMode: "plus-lighter" }}
      initial={false}
      animate={{ opacity: hot ? 0.5 : 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
    />
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "brand",
    size = "md",
    pending = false,
    fullWidth,
    glow = false,
    className,
    children,
    disabled,
    onPointerMove,
    onPointerEnter,
    onPointerLeave,
    onPointerDown,
    ...props
  },
  ref,
) {
  // Pointer position inside the button, in px, driving the radial highlight.
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const [hot, setHot] = useState(false);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const nextBurstId = useRef(0);
  const reduceMotion = useReducedMotion();

  const isDisabled = disabled || pending;
  const decorated = glow && !isDisabled;

  function trackPointer(event: ReactPointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    pointerX.set(event.clientX - rect.left);
    pointerY.set(event.clientY - rect.top);
  }

  return (
    <motion.button
      ref={ref}
      type="button"
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={cn(
        // `isolate` keeps the plus-lighter glow layers inside the button: without it they
        // join the nearest blend group and make an ancestor's backdrop-filter apply twice.
        "relative isolate select-none overflow-hidden outline-none transition-[color,background-color,border-color,filter,box-shadow] focus-visible:ring-2 focus-visible:ring-brand/70 disabled:cursor-not-allowed",
        "inline-flex items-center justify-center gap-2 font-semibold",
        variants[variant],
        sizes[size],
        fullWidth && "w-full",
        decorated && "shadow-[0_0_0_0_rgba(255,202,40,0)] hover:shadow-[0_6px_30px_-6px_rgba(255,202,40,0.8)]",
        className,
      )}
      disabled={isDisabled}
      aria-busy={pending || undefined}
      onPointerMove={(event) => {
        if (decorated) trackPointer(event);
        onPointerMove?.(event);
      }}
      onPointerEnter={(event) => {
        if (decorated) {
          trackPointer(event);
          setHot(true);
        }
        onPointerEnter?.(event);
      }}
      onPointerLeave={(event) => {
        setHot(false);
        onPointerLeave?.(event);
      }}
      onPointerDown={(event) => {
        if (decorated) {
          trackPointer(event);
          setHot(true);
          if (!reduceMotion) {
            const rect = event.currentTarget.getBoundingClientRect();
            const id = nextBurstId.current++;
            setBursts((list) => [...list, { id, x: event.clientX - rect.left, y: event.clientY - rect.top }]);
          }
        }
        onPointerDown?.(event);
      }}
      {...props}
    >
      {decorated ? (
        <>
          {/* `plus-lighter` keeps the gold hot under the highlight rather than washing it grey. */}
          <CursorBloom x={pointerX} y={pointerY} hot={hot} />
          <AnimatePresence>{hot ? <EnergyLayers animated={!reduceMotion} /> : null}</AnimatePresence>
          <AnimatePresence>
            {bursts.map((burst) => (
              <motion.span
                key={burst.id}
                aria-hidden
                className="pointer-events-none absolute size-6 rounded-full border border-white/80"
                style={{
                  left: burst.x - 12,
                  top: burst.y - 12,
                  background: "radial-gradient(circle, rgba(255,255,255,0.9), rgba(255,255,255,0) 70%)",
                  mixBlendMode: "plus-lighter",
                }}
                initial={{ scale: 0.35, opacity: 0.95 }}
                animate={{ scale: 11, opacity: 0 }}
                transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                onAnimationComplete={() =>
                  setBursts((list) => list.filter((entry) => entry.id !== burst.id))
                }
              />
            ))}
          </AnimatePresence>
        </>
      ) : null}
      <span className="relative z-10 inline-flex items-center justify-center gap-2">
        {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
        {children}
      </span>
    </motion.button>
  );
});
