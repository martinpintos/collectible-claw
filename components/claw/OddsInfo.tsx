"use client";

import { CircleQuestionMark, Percent, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { IconButton } from "@/components/ui/IconButton";
import { useAnimatedDialog } from "@/hooks/use-animated-dialog";
import { useHaptics } from "@/hooks/use-haptics";

const FACTS = [
  { label: "Odds based on", value: "Fair market value" },
  { label: "Updates", value: "Real-time" },
];

/** "?" affordance next to the Odds heading plus the explainer dialog it opens. */
export function OddsInfo() {
  const [open, setOpen] = useState(false);
  const haptics = useHaptics();
  const { dialogRef, handleExitComplete, handleCancel } = useAnimatedDialog(open, () => setOpen(false));

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label="How odds work"
        onClick={() => {
          haptics.fire("tap");
          setOpen(true);
        }}
        className="inline-flex size-5 items-center justify-center rounded-full border border-border text-fg-secondary outline-none transition-colors hover:border-control-border hover:bg-white/10 hover:text-fg focus-visible:ring-2 focus-visible:ring-brand/70"
      >
        <CircleQuestionMark className="size-3.5" aria-hidden />
      </button>

      <dialog
        ref={dialogRef}
        onCancel={handleCancel}
        onClick={(event) => {
          if (event.target === event.currentTarget) setOpen(false);
        }}
        aria-labelledby="odds-info-title"
        className="scrollbar-none m-auto max-h-[85dvh] w-[min(92vw,475px)] overflow-y-auto rounded-panel border border-border bg-panel p-0 text-fg shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        <AnimatePresence onExitComplete={handleExitComplete}>
          {open ? (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{
                opacity: 0,
                y: 6,
                scale: 0.985,
                transition: { duration: 0.16, ease: "easeIn" },
              }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="p-5 sm:p-6"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-chip text-fg-secondary">
                  <Percent className="size-4" aria-hidden />
                </span>
                <h2 id="odds-info-title" className="flex-1 text-xl font-semibold text-fg">
                  Odds
                </h2>
                <IconButton label="Close" className="-mr-2 size-9" onClick={() => setOpen(false)}>
                  <X className="size-5" />
                </IconButton>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-fg-secondary">
                Odds update in real time as items leave the Claw.
                <br />
                Each pull is fully independent, with odds determined by the Fair Market Value of the items
                currently in the Claw.
              </p>

              <dl className="mt-5 divide-y divide-border rounded-control border border-border bg-control px-4">
                {FACTS.map((fact) => (
                  <div key={fact.label} className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-sm text-fg-secondary">{fact.label}</dt>
                    <dd className="text-sm font-semibold text-fg">{fact.value}</dd>
                  </div>
                ))}
              </dl>

              <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-fg-secondary">
                <CircleQuestionMark className="mt-px size-4 shrink-0" aria-hidden />
                <span>
                  FMV is based on multiple market sources and updated periodically to reflect current market
                  conditions.
                </span>
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </dialog>
    </>
  );
}
