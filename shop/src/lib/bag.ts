"use client";

import { useCallback, useEffect, useState } from "react";
import {
  FLAT_SHIPPING_CENTS,
  FREE_SHIPPING_THRESHOLD_CENTS,
  SKU_PATTERN,
} from "@/lib/preview-catalog";

const STORAGE_KEY = "khla-bag-v1";
/** Same-tab listeners; the native `storage` event only fires in other tabs. */
const CHANGED = "khla-bag-changed";
/** Fired on add so the drawer can present itself. */
export const BAG_ADDED = "khla-bag-added";
const MAX_QTY = 10;

export type BagLine = { sku: string; qty: number };

/**
 * What the bag needs to draw a line without another round trip. Built on the
 * server from the published catalog so prices shown here are the CMS's, not
 * the browser's — the checkout route still re-prices every SKU on its own.
 */
export type BagEntry = {
  sku: string;
  slug: string;
  title: string;
  optionValue: string;
  unitAmount: number;
  image: string;
  alt: string;
};

export type BagIndex = Record<string, BagEntry>;

function read(): BagLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Anything in localStorage is user-editable, so re-validate every field.
    return parsed.flatMap((line) =>
      line && typeof line === "object" &&
      typeof (line as BagLine).sku === "string" &&
      SKU_PATTERN.test((line as BagLine).sku) &&
      Number.isSafeInteger((line as BagLine).qty) &&
      (line as BagLine).qty > 0
        ? [{ sku: (line as BagLine).sku, qty: Math.min((line as BagLine).qty, MAX_QTY) }]
        : [],
    );
  } catch {
    return [];
  }
}

function write(lines: BagLine[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // Private browsing or a full quota: the bag stays in memory for this page.
  }
  window.dispatchEvent(new Event(CHANGED));
}

export function useBag() {
  // Always start empty so the server and the first client render agree;
  // the real contents arrive in the effect below.
  const [lines, setLines] = useState<BagLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setLines(read());
    sync();
    setReady(true);
    window.addEventListener(CHANGED, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(CHANGED, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const add = useCallback((sku: string, qty = 1) => {
    const next = read();
    const found = next.find((line) => line.sku === sku);
    if (found) found.qty = Math.min(found.qty + qty, MAX_QTY);
    else next.push({ sku, qty: Math.min(qty, MAX_QTY) });
    write(next);
    window.dispatchEvent(new Event(BAG_ADDED));
  }, []);

  const setQty = useCallback((sku: string, qty: number) => {
    write(
      read().flatMap((line) =>
        line.sku !== sku ? [line] : qty > 0 ? [{ sku, qty: Math.min(qty, MAX_QTY) }] : [],
      ),
    );
  }, []);

  const remove = useCallback((sku: string) => setQty(sku, 0), [setQty]);

  return { lines, ready, add, setQty, remove };
}

export function bagTotals(lines: BagLine[], index: BagIndex) {
  // A SKU pulled from the CMS can still be in someone's saved cart. It renders
  // as nothing, so it must not count toward the badge or the subtotal either.
  const known = lines.filter((line) => index[line.sku]);
  const subtotal = known.reduce((sum, line) => sum + index[line.sku].unitAmount * line.qty, 0);
  const count = known.reduce((sum, line) => sum + line.qty, 0);
  const qualifies = subtotal >= FREE_SHIPPING_THRESHOLD_CENTS;
  return {
    subtotal,
    count,
    qualifies,
    remaining: Math.max(FREE_SHIPPING_THRESHOLD_CENTS - subtotal, 0),
    shipping: subtotal === 0 || qualifies ? 0 : FLAT_SHIPPING_CENTS,
  };
}

export { MAX_QTY };
