import Link from "next/link";
import {
  allHref,
  previewCopy,
  sectionHref,
  type Category,
  type Locale,
} from "@/lib/preview-catalog";

type Props = {
  counts: { category: Category; count: number }[];
  total: number;
  active: Category | null;
  locale: Locale;
};

/**
 * The catalog's own navigation: a rail down the left on a desktop, the same
 * list as a scrolling row of chips on a phone. Plain links with a server-side
 * filter rather than client state, so a category survives a refresh, can be
 * linked to, and works before any JavaScript arrives.
 */
export default function CategoryRail({ counts, total, active, locale }: Props) {
  const t = previewCopy[locale];

  const rows = [
    { key: null as Category | null, label: t.allProducts, count: total, href: allHref(locale) },
    ...counts.map((entry) => ({
      key: entry.category,
      label: t.category[entry.category],
      count: entry.count,
      href: sectionHref(entry.category, locale),
    })),
  ];

  // min-w-0 matters: a grid item defaults to min-width:auto, which would let
  // the chip row set the column's width and push the whole page sideways. The
  // horizontal scroll container can only do its job once the item may shrink.
  return (
    <nav aria-label={t.browseBy} className="min-w-0 lg:sticky lg:top-24 lg:self-start">
      <p className="hidden text-[11px] font-bold uppercase tracking-[0.18em] text-inkSoft lg:block">
        {t.browseBy}
      </p>
      <ul className="flex gap-2 overflow-x-auto pb-1 lg:mt-4 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {rows.map((row) => {
          const current = row.key === active;
          return (
            <li key={row.key ?? "all"}>
              <Link
                href={row.href}
                aria-current={current ? "page" : undefined}
                className={`inline-flex items-center whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] transition lg:w-full lg:justify-between lg:rounded-lg lg:px-3 ${
                  current
                    ? "bg-navy text-sand"
                    : "bg-sand text-inkMuted hover:bg-ink/5 hover:text-ink lg:bg-transparent"
                }`}
              >
                <span>{row.label}</span>
                <span
                  className={`tnum ml-2 hidden text-[11px] font-medium tabular-nums lg:inline ${
                    current ? "text-sand/70" : "text-inkSoft"
                  }`}
                >
                  {row.count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
