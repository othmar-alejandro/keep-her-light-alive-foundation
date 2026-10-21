"use client";

import { useId, useRef, useState } from "react";
import { MAX_QTY, useBag } from "@/lib/bag";
import {
  previewCopy,
  variantLabel,
  type Locale,
  type OptionKind,
  type PreviewVariant,
} from "@/lib/preview-catalog";

type Props = {
  variants: PreviewVariant[];
  optionKind: OptionKind;
  locale: Locale;
};

export default function AddToCart({ variants, optionKind, locale }: Props) {
  const t = previewCopy[locale];
  const { add } = useBag();
  const group = useId();
  // A single option is not a choice; preselect it so the only decision left is
  // the one that matters. With several, nothing is preselected so the shopper
  // picks a real size rather than silently accepting an S.
  const [sku, setSku] = useState(variants.length === 1 ? variants[0].sku : "");
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [needsOption, setNeedsOption] = useState(false);
  const optionsRef = useRef<HTMLFieldSetElement>(null);

  // The call to action stays live. Pressing it without a size points at the
  // size, rather than greeting the shopper with a dead gold button — and
  // nothing is preselected, so nobody is sold an accidental Small.
  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!sku) {
      setNeedsOption(true);
      optionsRef.current?.querySelector<HTMLInputElement>("input")?.focus();
      return;
    }
    setNeedsOption(false);
    add(sku, qty);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2200);
  }

  return (
    <form onSubmit={submit} className="mt-8 border-t border-line pt-6">
      <fieldset ref={optionsRef} className={variants.length === 1 ? "sr-only" : undefined}>
        <legend className="text-xs font-semibold uppercase tracking-[0.16em] text-inkMuted">
          {t.optionLabel[optionKind]}
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {variants.map((variant) => (
            <div key={variant.sku}>
              <input
                type="radio"
                id={`${group}-${variant.sku}`}
                name={group}
                value={variant.sku}
                checked={sku === variant.sku}
                onChange={() => {
                  setSku(variant.sku);
                  setNeedsOption(false);
                }}
                className="peer sr-only"
              />
              <label
                htmlFor={`${group}-${variant.sku}`}
                className="inline-flex min-w-[3.25rem] cursor-pointer items-center justify-center rounded-full border border-ink/55 bg-white px-4 py-2 text-sm text-ink transition hover:border-ink peer-checked:border-navy peer-checked:bg-navy peer-checked:text-sand peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-goldInk"
              >
                {variantLabel(variant, locale)}
              </label>
            </div>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 flex flex-wrap items-end gap-4">
        <div>
          <label
            htmlFor={`${group}-qty`}
            className="block text-xs font-semibold uppercase tracking-[0.16em] text-inkMuted"
          >
            {t.quantity}
          </label>
          <div className="mt-3 inline-flex items-center rounded-full border border-ink/55 bg-white">
            <button
              type="button"
              onClick={() => setQty((n) => Math.max(1, n - 1))}
              disabled={qty <= 1}
              aria-label={t.decrease}
              className="h-11 w-11 rounded-l-full text-lg text-ink disabled:text-ink/30"
            >
              −
            </button>
            <output
              id={`${group}-qty`}
              aria-live="polite"
              className="tnum w-8 text-center text-sm font-semibold"
            >
              {qty}
            </output>
            <button
              type="button"
              onClick={() => setQty((n) => Math.min(MAX_QTY, n + 1))}
              disabled={qty >= MAX_QTY}
              aria-label={t.increase}
              className="h-11 w-11 rounded-r-full text-lg text-ink disabled:text-ink/30"
            >
              +
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="h-12 flex-1 rounded-full bg-gold px-8 text-sm font-bold text-black shadow-[0_14px_30px_-12px_rgba(212,175,55,0.7)] transition hover:bg-white sm:flex-none"
        >
          {t.addToCart}
        </button>
      </div>

      <p aria-live="polite" className="mt-3 min-h-5 text-sm font-medium text-navy">
        {needsOption ? t.chooseOption[optionKind] : added ? t.addedToCart : ""}
      </p>
    </form>
  );
}
