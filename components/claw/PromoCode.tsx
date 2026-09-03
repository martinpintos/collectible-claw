"use client";

import { ChevronDown, X } from "lucide-react";
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
        {promo ? (
          <div className="flex h-9 items-center justify-between rounded-input border border-brand/40 bg-brand/10 px-3 text-sm">
            <span>
              <span className="font-semibold text-brand">{promo.code}</span>
              <span className="ml-2 text-fg-secondary">{promo.label}</span>
            </span>
            <button
              type="button"
              aria-label="Remove promo code"
              className="text-fg-secondary hover:text-fg"
              onClick={() => dispatch({ type: "SET_PROMO", promo: null })}
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <form
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
          </form>
        )}
        {error ? (
          <p role="alert" className="mt-1.5 text-xs text-danger">
            {error}
          </p>
        ) : (
          <p className="mt-1.5 text-xs text-fg-secondary/70">Try BEEZIE10 or CLAW20.</p>
        )}
      </div>
    </div>
  );
}
