"use client";

import { useEffect } from "react";
import { Logo } from "@/components/claw/Logo";

/**
 * Route-level boundary. Catches anything thrown while rendering the claw page
 * (including a repository read) so a failure lands on a recoverable screen
 * instead of a blank document. `retry()` re-fetches and re-renders the segment.
 */
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <Logo />
      <div>
        <h1 className="text-2xl font-semibold">The claw jammed.</h1>
        <p className="mt-2 text-fg-secondary">
          Something went wrong on our side. Nothing was charged.
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-xs text-fg-secondary/70">Ref: {error.digest}</p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={retry}
        className="rounded-input bg-brand px-5 py-3 font-semibold text-brand-fg outline-none focus-visible:ring-2 focus-visible:ring-brand/70"
      >
        Try again
      </button>
    </main>
  );
}
