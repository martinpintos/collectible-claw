"use client";

import { Check, ChevronDown, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useId, useState, useTransition } from "react";
import { applyPromo } from "@/app/actions";
import { useHaptics } from "@/hooks/use-haptics";
import { useClawFlow } from "@/store/claw-flow-provider";
import { cn } from "@/lib/utils/cn";

export function PromoCode() {
  const { promo, dispatch } = useClawFlow((s) => ({ promo: s.promo, dispatch: s.dispatch }));
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const haptics = useHaptics();
  const inputId = useId();

  const submit = () => {
    if (!code.trim()) return;
    startTransition(async () => {
      const result = await applyPromo({ code });
      if (result.ok) {
        haptics.fire("success");
        dispatch({ type: "SET_PROMO", promo: result.data });
        setError(null);
        setCode("");
      } else {
        haptics.fire("error");
        setError(result.error);
      }
    });
  };

  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center justify-between text-sm font-medium text-fg lg:pointer-events-none"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <label htmlFor={inputId} className="cursor-pointer">
          Apply promo code
        </label>
        <ChevronDown
          className={cn("size-4 text-fg-secondary transition-transform lg:hidden", open && "rotate-180")}
          aria-hidden
        />
      </button>

      <div className={cn("mt-2 lg:block", open ? "block" : "hidden")}>
        <AnimatePresence initial={false} mode="wait">
          {promo ? (
            <motion.div
              key="applied-promo"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex h-9 items-center justify-between rounded-input border border-brand/40 bg-brand/10 px-3 text-sm"
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <Check className="size-3.5 shrink-0 text-brand" aria-hidden />
                <span className="font-semibold text-brand">{promo.code}</span>
                <span className="truncate text-fg-secondary">{promo.label}</span>
              </span>
              <button
                type="button"
                aria-label="Remove promo code"
                className="text-fg-secondary hover:text-fg"
                onClick={() => dispatch({ type: "SET_PROMO", promo: null })}
              >
                <X className="size-4" />
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="promo-form"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                submit();
              }}
            >
              <input
                id={inputId}
                value={code}
                onChange={(event) => {
                  setCode(event.target.value.toUpperCase());
                  if (error) setError(null);
                }}
                placeholder="Enter Code"
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                className="h-9 min-w-0 flex-1 rounded-input bg-input px-3 text-sm text-fg outline-none placeholder:text-placeholder focus-visible:ring-2 focus-visible:ring-brand/60"
              />
              <button
                type="submit"
                disabled={!code.trim() || pending}
                className="h-9 w-20 shrink-0 rounded-input bg-input text-sm font-medium text-fg transition-colors disabled:text-disabled"
              >
                {pending ? "…" : "Apply"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false} mode="wait">
          {error ? (
            <motion.p
              key="promo-error"
              role="alert"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="mt-1.5 text-xs text-danger"
            >
              {error}
            </motion.p>
          ) : (
            <motion.p
              key="promo-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="mt-1.5 text-xs text-fg-secondary/70"
            >
              Try BEEZIE10 or CLAW20.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
