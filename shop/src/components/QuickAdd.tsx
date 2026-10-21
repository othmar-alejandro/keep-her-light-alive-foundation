"use client";

import Link from "next/link";
import { useState } from "react";
import { useBag } from "@/lib/bag";
import {
  previewCopy,
  productHref,
  type Locale,
  type OptionKind,
  type PreviewVariant,
} from "@/lib/preview-catalog";

type Props = {
  slug: string;
  variants: PreviewVariant[];
  optionKind: OptionKind;
  locale: Locale;
};

/**
 * A listing card cannot add a garment that still needs a size, so this follows
 * the split the reference themes use: one variant adds straight to the cart,
 * several send you to the product page to choose. No silent default size.
 */
export default function QuickAdd({ slug, variants, optionKind, locale }: Props) {
  const t = previewCopy[locale];
  const { add } = useBag();
  const [added, setAdded] = useState(false);

  if (variants.length !== 1) {
    return (
      <Link
        href={productHref(slug, locale)}
        className="mt-5 inline-flex w-fit items-center rounded-full border-2 border-ink/50 px-7 py-3 text-xs font-bold uppercase tracking-[0.1em] text-ink transition hover:border-ink hover:bg-ink hover:text-sand active:translate-y-px"
      >
        {t.chooseOption[optionKind]}
      </Link>
    );
  }

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={() => {
          add(variants[0].sku, 1);
          setAdded(true);
          window.setTimeout(() => setAdded(false), 2200);
        }}
        className="inline-flex w-fit items-center rounded-full bg-gold px-7 py-3 text-xs font-bold uppercase tracking-[0.1em] text-black transition hover:bg-ink hover:text-sand active:translate-y-px"
      >
        {t.addToCart}
      </button>
      <p aria-live="polite" className="mt-2 min-h-5 text-xs font-medium text-navy">
        {added ? t.addedToCart : ""}
      </p>
    </div>
  );
}
