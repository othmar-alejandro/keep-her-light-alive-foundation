import Link from "next/link";
import { catalogHref, previewCopy } from "@/lib/preview-catalog";

/**
 * A dead product link should still look like the shop. Server-rendered with
 * no access to the query string, so this is the English copy; the links carry
 * the reader back into a page that does respect their language.
 */
export default function NotFound() {
  const t = previewCopy.en;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-sand px-6 text-center text-ink">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-goldInk">404</p>
      <h1 className="mt-5 max-w-xl font-display text-[clamp(2rem,5vw,3rem)] leading-[1.1] tracking-[-0.02em]">
        {t.notFoundTitle}
      </h1>
      <p className="mt-4 max-w-md text-base leading-7 text-inkMuted">{t.notFoundBody}</p>
      <Link
        href={catalogHref("en")}
        className="mt-8 inline-flex items-center rounded-full bg-gold px-8 py-4 text-sm font-bold text-black transition hover:bg-ink hover:text-sand"
      >
        {t.back}
      </Link>
    </main>
  );
}
