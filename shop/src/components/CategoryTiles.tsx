import Link from "next/link";
import {
  allHref,
  assetUrl,
  previewCopy,
  sectionHref,
  type Category,
  type Locale,
  type PreviewProduct,
} from "@/lib/preview-catalog";

type Props = {
  groups: { category: Category; products: PreviewProduct[] }[];
  locale: Locale;
  total: number;
  heading: string;
};

/**
 * Collection tiles carried by lifestyle photography rather than a cut-out
 * product on a tint. Each shot shows the real printed artwork on the real
 * garment, so the tile sells the section instead of labelling it.
 */
const FACES: Record<Category, string> = {
  tees: "life-tees.jpg",
  fishing: "life-fishing.jpg",
  bags: "life-bags.jpg",
  drinkware: "life-drinkware.jpg",
};

export default function CategoryTiles({ groups, locale, total, heading }: Props) {
  const t = previewCopy[locale];

  return (
    <section className="mx-auto max-w-[1400px] px-6 py-16 lg:px-12 lg:py-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 data-reveal className="font-display text-[clamp(2rem,4.2vw,3.25rem)] font-normal leading-[1.05] tracking-[-0.02em]">
          {heading || t.categoryHeading}
        </h2>
        <Link
          href={allHref(locale)}
          className="py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-ink underline decoration-ink/30 underline-offset-[6px] hover:decoration-ink"
        >
          {t.viewAll.replace("{n}", String(total))}
        </Link>
      </div>

      <ul className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {groups.map((group, index) => (
          <li key={group.category} data-reveal data-reveal-index={index}>
            <Link
              href={sectionHref(group.category, locale)}
              className="group relative block aspect-[3/4] overflow-hidden rounded-2xl bg-navy"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={assetUrl(FACES[group.category])}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-[250ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-[1.04]"
              />
              {/* Photographs vary, so the label sits on a scrim deep enough to
                  hold white type over the brightest frame. Measured, not eyeballed. */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/85 via-black/45 to-transparent"
              />
              <span className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                <span className="block font-display text-xl leading-tight text-white sm:text-2xl">
                  {t.category[group.category]}
                </span>
                <span className="mt-1 block text-[11px] font-bold uppercase tracking-[0.16em] text-white/90">
                  {t.shopCount.replace("{n}", String(group.products.length))}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
