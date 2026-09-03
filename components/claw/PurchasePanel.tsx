"use client";

import { Button } from "@/components/ui/Button";
import { Stepper } from "@/components/ui/Stepper";
import { useHaptics } from "@/hooks/use-haptics";
import { useClawFlow } from "@/store/claw-flow-provider";
import { cn } from "@/lib/utils/cn";

export function PurchaseControls({ className, ctaLabel = "Start Now" }: { className?: string; ctaLabel?: string }) {
  const { quantity, maxQuantity, phase, dispatch } = useClawFlow((s) => ({
    quantity: s.quantity,
    maxQuantity: s.maxQuantity,
    phase: s.phase,
    dispatch: s.dispatch,
  }));
  const haptics = useHaptics();

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Stepper
        value={quantity}
        max={maxQuantity}
        onChange={(next) => dispatch({ type: "SET_QUANTITY", quantity: next })}
      />
      <Button
        size="lg"
        fullWidth
        disabled={phase !== "idle"}
        onClick={() => {
          haptics.fire("confirm");
          dispatch({ type: "START" });
        }}
      >
        {ctaLabel}
      </Button>
    </div>
  );
}

/** Inline stepper + CTA inside the details card (desktop). */
export function PurchasePanel() {
  return <PurchaseControls className="hidden lg:flex" />;
}

/** Fixed bottom bar on mobile so the CTA is always reachable. */
export function StickyPurchaseBar() {
  return (
    <div className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-border/80 bg-bg/90 backdrop-blur-md lg:hidden">
      <div className="px-4 py-3">
        <PurchaseControls />
      </div>
    </div>
  );
}
