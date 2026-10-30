import Link from "next/link";
import QuickAdd from "@/components/QuickAdd";
import {
  assetUrl,
  formatPrice,
  previewCopy,
  productHref,
  type Category,
  type Locale,
  type PreviewProduct,
} from "@/lib/preview-catalog";

type Props = {
  products: PreviewProduct[];
  locale: Locale;
  preview: boolean;
};

/** One field per section, so a row is tinted by what it sells. */
const FIELDS: Record<Category, string> = {
  tees: "#E7EDE7",
  fishing: "#E4EDF4",
  bags: "#EFEAE1",
  drinkware: "#F4E9CE",
};

/**
 * Two products per row rather than a four-up grid, each on a tinted panel at
 * roughly three times the size a card gave it. Sides alternate down the page
 * so the eye has to travel. The mockups are shot on near-white, so multiply
 * drops that background into the tint.
 */
export default function FeaturedRows({ products, locale, preview }: Props) {
  const t = previewCopy[locale];

  return (
    <ul className="mt-12 grid gap-3 lg:gap-4">
      {products.map((product, index) => {
        const imageFirst = index % 2 === 0;
        return (
          <li
            key={product.slug}
            data-reveal
            className={`grid gap-3 lg:gap-4 ${
              imageFirst
                ? "lg:grid-cols-[1.15fr_minmax(0,1fr)]"
                : "lg:grid-cols-[minmax(0,1fr)_1.15fr]"
            }`}
          >
            <Link
              href={productHref(product.slug, locale)}
              aria-label={product.title[locale]}
              className={`group relative grid aspect-[16/11] place-items-center overflow-hidden rounded-[1.25rem] p-6 sm:aspect-[16/10] sm:p-10 ${
                imageFirst ? "" : "lg:order-2"
              }`}
              style={{ backgroundColor: FIELDS[product.category] }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={assetUrl(product.images[0].file)}
                alt={product.images[0].alt[locale]}
                loading={index < 2 ? "eager" : "lazy"}
                className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform duration-[250ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group-hover:scale-[1.03]"
              />
            </Link>

            <div
              className={`flex flex-col justify-center rounded-[1.25rem] bg-sand px-7 py-9 sm:px-10 ${
                imageFirst ? "" : "lg:order-1"
              }`}
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-inkSoft">
                {t.category[product.category]}
              </p>
              <h3 className="mt-2 font-display text-2xl leading-[1.15] sm:text-[1.75rem]">
                <Link
                  href={productHref(product.slug, locale)}
                  className="hover:underline decoration-ink/30 underline-offset-4"
                >
                  <span lang={locale}>{product.title[locale]}</span>
                </Link>
              </h3>

              {product.description?.[locale] && (
                <p className="mt-3 max-w-sm text-sm leading-6 text-inkMuted">
                  {product.description[locale]}
                </p>
              )}

              <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="tnum text-lg font-semibold">
                  {product.priceVaries ? `${t.priceFrom} ` : ""}
                  {formatPrice(product.priceCents, locale)}
                </span>
                {preview && (
                  <span className="rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] text-black">
                    {t.provisional}
                  </span>
                )}
              </p>

              <QuickAdd
                slug={product.slug}
                variants={product.variants}
                optionKind={product.optionKind ?? "size"}
                locale={locale}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
