import Link from "next/link";
import {
  assetUrl,
  formatPrice,
  previewCopy,
  productHref,
  type Locale,
  type PreviewProduct,
} from "@/lib/preview-catalog";

type Props = {
  product: PreviewProduct;
  locale: Locale;
  /** The first row on the catalog page is above the fold on most screens. */
  priority?: boolean;
};

export default function ProductCard({ product, locale, priority }: Props) {
  const [front, back] = product.images;
  const t = previewCopy[locale];

  return (
    <li className="group">
      <Link
        href={productHref(product.slug, locale)}
        className="flex h-full flex-col rounded-2xl outline-offset-4"
      >
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-card transition-shadow duration-[250ms] group-hover:shadow-lift">
          <div className="aspect-square p-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={assetUrl(front.file)}
              alt={front.alt[locale]}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : undefined}
              className={`h-full w-full object-contain transition duration-[250ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] ${
                back ? "lg:group-hover:opacity-0" : "lg:group-hover:scale-[1.04]"
              }`}
            />
          </div>
          {/* The back print is the reason most of these shirts sell, so it is
              one hover away instead of one click away. */}
          {back && (
            <div className="absolute inset-0 hidden p-5 opacity-0 transition-opacity duration-[250ms] ease-[cubic-bezier(0.25,0.46,0.45,0.94)] lg:block lg:group-hover:opacity-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={assetUrl(back.file)}
                alt=""
                aria-hidden="true"
                loading="lazy"
                className="h-full w-full object-contain"
              />
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col px-1 pt-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-inkSoft">
            {t.category[product.category]}
          </p>
          <h3 className="mt-1.5 font-display text-lg leading-snug">
            <span lang={locale}>{product.title[locale]}</span>
          </h3>
          <p className="tnum mt-1 text-sm font-semibold text-ink">
            {product.priceVaries ? `${t.priceFrom} ` : ""}
            {formatPrice(product.priceCents, locale)}
          </p>
        </div>
      </Link>
    </li>
  );
}
