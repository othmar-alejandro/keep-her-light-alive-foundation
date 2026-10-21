import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCart from "@/components/AddToCart";
import PreviewBanner from "@/components/PreviewBanner";
import ProductCard from "@/components/ProductCard";
import ProductGallery from "@/components/ProductGallery";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { getStorefrontCatalog } from "@/lib/hygraph-catalog";
import {
  assetUrl,
  buildBagIndex,
  catalogHref,
  formatPrice,
  previewCopy,
  sectionHref,
  type Locale,
} from "@/lib/preview-catalog";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
};

function resolveLocale(lang: string | undefined): Locale {
  return lang === "es" ? "es" : "en";
}

export async function generateMetadata({
  params,
  searchParams,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { lang } = await searchParams;
  const locale = resolveLocale(lang);
  const { products, preview } = await getStorefrontCatalog();
  const product = products.find((entry) => entry.slug === slug);
  if (!product) return { title: "Keep Her Light Alive Shop" };
  return {
    title: `${product.title[locale]} — Keep Her Light Alive Shop${preview ? " (preview)" : ""}`,
    description: product.description?.[locale],
    openGraph: {
      title: product.title[locale],
      description: product.description?.[locale],
      // A CMS image is already an absolute URL; assetUrl knows the difference.
      images: [assetUrl(product.images[0].file)],
    },
  };
}

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { slug } = await params;
  const { lang } = await searchParams;
  const locale = resolveLocale(lang);
  const t = previewCopy[locale];

  const { products, preview, error } = await getStorefrontCatalog();
  const product = products.find((entry) => entry.slug === slug);
  // A Hygraph outage empties the catalog. Every product would 404, which reads
  // as "this is gone for good" rather than "the shop is having a moment".
  if (!product) {
    if (error) {
      return (
        <div className="flex min-h-screen flex-col bg-sand text-ink">
          <SiteHeader locale={locale} index={{}} path="/" />
          <main className="flex-1">
            {/* The message is this page's heading, or an outage leaves the
                document with no h1 at all. */}
            <h1
              role="alert"
              className="mx-auto max-w-[1400px] px-6 py-24 font-display text-2xl leading-snug lg:px-12"
            >
              {t.catalogError}
            </h1>
          </main>
          <SiteFooter locale={locale} preview={preview} />
        </div>
      );
    }
    notFound();
  }

  const related = products
    .filter((entry) => entry.category === product.category && entry.slug !== product.slug)
    .slice(0, 4);

  return (
    <div className="flex min-h-screen flex-col bg-sand text-ink">
      <a
        href="#product"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-5 focus:py-2 focus:text-sm focus:font-semibold focus:text-sand"
      >
        {t.skipToProduct}
      </a>

      {preview && <PreviewBanner locale={locale} />}
      <SiteHeader
        locale={locale}
        index={buildBagIndex(products, locale)}
        path={`/p/${product.slug}`}
      />

      <main id="product" className="mx-auto w-full max-w-6xl flex-1 px-5 py-6 sm:px-8 sm:py-10">
        <nav aria-label={t.breadcrumbLabel}>
          <ol className="flex flex-wrap items-center gap-1.5 text-xs text-inkMuted">
            <li>
              <Link href={catalogHref(locale)} className="inline-block py-1.5 hover:text-ink hover:underline">
                {t.heroEyebrow}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link
                href={sectionHref(product.category, locale)}
                className="inline-block py-1.5 hover:text-ink hover:underline"
              >
                {t.category[product.category]}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-ink">
              {product.title[locale]}
            </li>
          </ol>
        </nav>

        <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] lg:gap-16">
          <ProductGallery images={product.images} locale={locale} />

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-inkMuted">
              {t.category[product.category]}
            </p>
            <h1 className="mt-2 font-display text-3xl leading-[1.1] sm:text-4xl">
              <span lang={locale}>{product.title[locale]}</span>
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="tnum text-2xl font-semibold">
                {product.priceVaries ? `${t.priceFrom} ` : ""}
                {formatPrice(product.priceCents, locale)}
              </span>
              {preview && (
                <span className="rounded-full bg-gold px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink">
                  {t.provisional}
                </span>
              )}
            </div>

            <AddToCart
              variants={product.variants}
              optionKind={product.optionKind ?? "size"}
              locale={locale}
            />

            <p className="mt-5 flex items-center gap-2 text-sm font-medium text-goldInk">
              <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M2.5 6.5h9v7h-9z" strokeLinejoin="round" />
                <path d="M11.5 9h3l3 2.5v2h-6z" strokeLinejoin="round" />
                <circle cx="6" cy="15" r="1.5" />
                <circle cx="14" cy="15" r="1.5" />
              </svg>
              {t.freeShipping}
            </p>

            <div className="mt-6 divide-y divide-line border-y border-line">
              <details className="group py-3" open>
                <summary className="flex cursor-pointer list-none items-center justify-between py-1.5 text-sm font-semibold">
                  {t.detailsHeading}
                  <span aria-hidden="true" className="text-inkSoft transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                {product.description?.[locale] && (
                  <p className="mt-2 text-sm leading-6 text-inkMuted">
                    {product.description[locale]}
                  </p>
                )}
                {preview && (
                  <p className="mt-2 text-sm leading-6 text-inkSoft">{t.toBeConfirmed}</p>
                )}
              </details>
              <details className="group py-3">
                <summary className="flex cursor-pointer list-none items-center justify-between py-1.5 text-sm font-semibold">
                  {t.shippingHeading}
                  <span aria-hidden="true" className="text-inkSoft transition group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-6 text-inkMuted">{t.shippingBody}</p>
              </details>
            </div>

            <p className="mt-6 rounded-2xl bg-navy px-5 py-4 text-sm leading-6 text-sand">
              {t.impact}
            </p>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16 border-t border-line pt-10 sm:mt-20">
            <h2 className="font-display text-2xl">
              {t.relatedHeading}
            </h2>
            <ul className="mt-6 grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4">
              {related.map((entry) => (
                <ProductCard key={entry.slug} product={entry} locale={locale} />
              ))}
            </ul>
          </section>
        )}
      </main>

      <SiteFooter locale={locale} preview={preview} />
    </div>
  );
}
