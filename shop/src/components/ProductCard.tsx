import Link from "next/link";
import {
  assetUrl,
  formatPrice,
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

  return (
    <li className="group">
      <Link
        href={productHref(product.slug, locale)}
        className="flex h-full flex-col rounded-2xl outline-offset-4"
      >
        <div className="relative overflow-hidden rounded-2xl bg-white shadow-card transition duration-300 group-hover:shadow-lift">
          <div className="aspect-square p-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={assetUrl(front.file)}
              alt={front.alt[locale]}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : undefined}
              className={`h-full w-full object-contain transition duration-500 ${
                back ? "lg:group-hover:opacity-0" : "lg:group-hover:scale-[1.04]"
              }`}
            />
          </div>
          {/* The back print is the reason most of these shirts sell, so it is
              one hover away instead of one click away. */}
          {back && (
            <div className="absolute inset-0 hidden p-5 opacity-0 transition duration-500 lg:block lg:group-hover:opacity-100">
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
          <h3 className="font-display text-lg leading-snug">
            <span lang={locale}>{product.title[locale]}</span>
          </h3>
          <p className="tnum mt-1 text-sm font-semibold text-ink">
            {formatPrice(product.priceCents, locale)}
          </p>
        </div>
      </Link>
    </li>
  );
}
