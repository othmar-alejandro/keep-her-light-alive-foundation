"use client";

import { useEffect } from "react";
import { previewCopy } from "@/lib/preview-catalog";

/**
 * Catches a render failure so a shopper sees the shop's own apology rather
 * than an unstyled stack trace. `reset` re-runs the failed render.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = previewCopy.en;

  useEffect(() => {
    console.error("Storefront render failed:", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-sand px-6 text-center text-ink">
      <h1 className="max-w-xl font-display text-[clamp(2rem,5vw,3rem)] leading-[1.1] tracking-[-0.02em]">
        {t.errorTitle}
      </h1>
      <p className="mt-4 max-w-md text-base leading-7 text-inkMuted">{t.errorBody}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-flex items-center rounded-full bg-gold px-8 py-4 text-sm font-bold text-black transition hover:bg-ink hover:text-sand"
      >
        {t.tryAgain}
      </button>
    </main>
  );
}
