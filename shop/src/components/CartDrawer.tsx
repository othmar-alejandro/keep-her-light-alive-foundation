"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BAG_ADDED, bagTotals, MAX_QTY, useBag, type BagIndex } from "@/lib/bag";
import {
  assetUrl,
  formatPrice,
  previewCopy,
  productHref,
  type Locale,
} from "@/lib/preview-catalog";

type Props = {
  index: BagIndex;
  locale: Locale;
};

export default function CartDrawer({ index, locale }: Props) {
  const t = previewCopy[locale];
  const { lines, ready, setQty, remove } = useBag();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Let the panel travel back out before it unmounts, instead of vanishing.
  function dismiss() {
    setClosing(true);
    window.setTimeout(() => {
      setClosing(false);
      setOpen(false);
      openerRef.current?.focus();
    }, 200);
  }
  const panelRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  const totals = bagTotals(lines, index);
  // A saved SKU the catalog no longer knows renders as nothing. Counting it as
  // a line would show an empty list with a $0.00 total instead of "cart empty".
  const known = lines.filter((line) => index[line.sku]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener(BAG_ADDED, show);
    return () => window.removeEventListener(BAG_ADDED, show);
  }, []);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    panel?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        dismiss();
        return;
      }
      if (event.key !== "Tab" || !panel) return;
      // Keep Tab inside the dialog; without this it walks the page behind it.
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href],button:not([disabled]),input,[tabindex]:not([tabindex="-1"])',
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <>
      <button
        ref={openerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={totals.count ? `${t.openCart} — ${t.itemsInCart.replace("{n}", String(totals.count))}` : t.openCart}
        className="relative inline-flex h-10 items-center gap-2 rounded-full border border-ink/15 px-4 text-xs font-semibold uppercase tracking-[0.14em] text-ink transition hover:border-ink"
      >
        <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3.5 6h13l-1 10.5a1.5 1.5 0 0 1-1.5 1.4H6a1.5 1.5 0 0 1-1.5-1.4L3.5 6Z" strokeLinejoin="round" />
          <path d="M7.25 6V4.75a2.75 2.75 0 0 1 5.5 0V6" strokeLinecap="round" />
        </svg>
        {t.cart}
        {/* Hidden until hydration so server and client markup agree. Keyed on
            the count so React remounts it and the bubble replays, which is the
            confirmation that the add landed. */}
        {ready && totals.count > 0 && (
          <span
            key={totals.count}
            className="khla-bubble tnum absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-navy px-1 text-[11px] font-bold text-sand"
          >
            {totals.count}
          </span>
        )}
      </button>

      {/* Portalled to <body>: the header sets backdrop-filter, which makes it a
          containing block for fixed children and would trap the drawer inside
          the 64px header bar. */}
      {open && mounted && createPortal(
        <div className={`fixed inset-0 z-50 ${closing ? "khla-closing" : ""}`}>
          <button
            type="button"
            aria-label={t.closeCart}
            onClick={dismiss}
            className="khla-scrim absolute inset-0 h-full w-full cursor-default bg-navy/35"
          />
          <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-label={t.cart}
            className="khla-panel absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-drawer"
          >
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="font-display text-xl">{t.cart}</h2>
              <button
                type="button"
                data-autofocus
                onClick={dismiss}
                aria-label={t.closeCart}
                className="-mr-2 flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-ink/5"
              >
                <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="m5 5 10 10M15 5 5 15" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {known.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-2 px-8 text-center">
                <p className="font-display text-lg">{t.cartEmpty}</p>
                <p className="text-sm text-inkMuted">{t.cartEmptyHint}</p>
              </div>
            ) : (
              <ul className="flex-1 divide-y divide-line overflow-y-auto px-5">
                {known.map((line) => {
                  const entry = index[line.sku];
                  return (
                    <li key={line.sku} className="flex gap-4 py-4">
                      <Link
                        href={productHref(entry.slug, locale)}
                        onClick={dismiss}
                        className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-sand p-1.5"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={assetUrl(entry.image)} alt={entry.alt} className="h-full w-full object-contain" />
                      </Link>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={productHref(entry.slug, locale)}
                          onClick={dismiss}
                          className="block truncate py-1 text-sm font-semibold hover:underline"
                        >
                          {entry.title}
                        </Link>
                        <p className="mt-0.5 text-xs text-inkMuted">{entry.optionValue}</p>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="inline-flex items-center rounded-full border border-ink/20 bg-white">
                            <button
                              type="button"
                              aria-label={t.decrease}
                              onClick={() => setQty(line.sku, line.qty - 1)}
                              className="h-8 w-8 rounded-l-full text-ink"
                            >
                              −
                            </button>
                            <span className="tnum w-6 text-center text-xs font-semibold">{line.qty}</span>
                            <button
                              type="button"
                              aria-label={t.increase}
                              disabled={line.qty >= MAX_QTY}
                              onClick={() => setQty(line.sku, line.qty + 1)}
                              className="h-8 w-8 rounded-r-full text-ink disabled:text-ink/30"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(line.sku)}
                            className="px-1 py-1.5 text-xs text-inkMuted underline underline-offset-4 hover:text-ink"
                          >
                            {t.removeItem}
                          </button>
                        </div>
                      </div>
                      <p className="tnum text-sm font-semibold">
                        {formatPrice(entry.unitAmount * line.qty, locale)}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="border-t border-line px-5 py-4">
              {known.length > 0 && (
                <>
                  <p className="rounded-xl bg-white px-4 py-2.5 text-center text-xs font-medium text-navy">
                    {totals.qualifies
                      ? t.freeShippingEarned
                      : t.freeShippingProgress.replace(
                          "{amount}",
                          formatPrice(totals.remaining, locale),
                        )}
                  </p>
                  <div
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.min(
                      100,
                      Math.round((totals.subtotal / (totals.subtotal + totals.remaining || 1)) * 100),
                    )}
                    aria-label={t.shipping}
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink/10"
                  >
                    <span
                      className="block h-full rounded-full bg-gold transition-[width] duration-500"
                      style={{
                        width: `${Math.min(100, (totals.subtotal / (totals.subtotal + totals.remaining || 1)) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="mt-4 flex items-baseline justify-between text-sm">
                    <span className="font-semibold uppercase tracking-[0.12em] text-inkMuted">
                      {t.subtotal}
                    </span>
                    <span className="tnum text-lg font-semibold">
                      {formatPrice(totals.subtotal, locale)}
                    </span>
                  </p>
                </>
              )}
              <button
                type="button"
                disabled
                className="mt-4 h-12 w-full cursor-not-allowed rounded-full bg-ink/10 text-sm font-semibold uppercase tracking-[0.12em] text-inkSoft"
              >
                {t.checkoutSoon}
              </button>
              <p className="mt-3 text-center text-xs leading-5 text-inkMuted">
                {t.checkoutSoonNote}
              </p>
              <p className="mt-2 text-center text-xs leading-5 text-inkSoft">{t.taxNote}</p>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
