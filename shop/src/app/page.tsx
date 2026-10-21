import PreviewBanner from "@/components/PreviewBanner";
import ProductCard from "@/components/ProductCard";
import SectionNav from "@/components/SectionNav";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { getStorefrontCatalog } from "@/lib/hygraph-catalog";
import {
  buildBagIndex,
  groupByCategory,
  previewCopy,
  type Locale,
} from "@/lib/preview-catalog";

type ShopPageProps = {
  searchParams: Promise<{ lang?: string }>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { lang } = await searchParams;
  const locale: Locale = lang === "es" ? "es" : "en";
  const t = previewCopy[locale];
  const { products, preview, error } = await getStorefrontCatalog();
  const groups = groupByCategory(products);

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <a
        href="#catalog"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-5 focus:py-2 focus:text-sm focus:font-semibold focus:text-sand"
      >
        {t.skipToContent}
      </a>

      {preview && <PreviewBanner locale={locale} />}
      <SiteHeader locale={locale} index={buildBagIndex(products, locale)} path="/" />

      <main className="flex-1">
        <section className="mx-auto max-w-[1400px] px-6 pb-12 pt-14 lg:px-12 lg:pt-20">
          <span className="block text-xs font-bold uppercase tracking-[0.2em] text-goldInk">
            {t.heroEyebrow}
          </span>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-[1.1] text-ink md:text-5xl">
            {t.heroTitle}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-inkMuted">{t.heroBody}</p>

          {!preview && (
          <ul className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm text-inkMuted">
            {t.trust.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 20 20"
                  className="h-4 w-4 shrink-0 text-goldInk"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="m4.5 10.5 3.5 3.5 7.5-8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {point}
              </li>
            ))}
          </ul>
          )}

          <p className="mt-8 inline-flex rounded-full bg-gold px-5 py-2 text-xs font-bold uppercase tracking-[0.12em] text-black">
            {t.freeShipping}
          </p>
        </section>

        {error && (
          <p role="alert" className="mx-auto max-w-[1400px] px-6 pb-20 text-sm lg:px-12">
            {t.catalogError}
          </p>
        )}
        {!error && products.length === 0 && (
          <p className="mx-auto max-w-[1400px] px-6 pb-20 text-sm lg:px-12">{t.catalogReady}</p>
        )}

        {groups.length > 0 && (
          <>
            <SectionNav
              label={t.h1}
              sections={groups.map((group) => ({
                id: group.category,
                label: t.category[group.category],
              }))}
            />

            {/* Sand band with white cards — the live site's own product recipe. */}
            <div id="catalog" className="border-t border-gray-100 bg-sand">
              <div className="mx-auto max-w-[1400px] px-6 pb-20 lg:px-12">
                {groups.map((group, groupIndex) => (
                  <section
                    key={group.category}
                    id={group.category}
                    aria-labelledby={`${group.category}-heading`}
                    className="scroll-mt-32 pt-14 lg:pt-20"
                  >
                    <div className="flex items-baseline justify-between gap-4 border-b border-black/10 pb-4">
                      <h2
                        id={`${group.category}-heading`}
                        className="font-display text-3xl leading-tight md:text-4xl"
                      >
                        {t.category[group.category]}
                      </h2>
                      <span className="tnum text-xs uppercase tracking-[0.1em] text-inkSoft">
                        {(group.products.length === 1 ? t.itemCount.one : t.itemCount.other).replace(
                          "{n}",
                          String(group.products.length),
                        )}
                      </span>
                    </div>
                    <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:gap-x-8 lg:grid-cols-4">
                      {group.products.map((product, index) => (
                        <ProductCard
                          key={product.slug}
                          product={product}
                          locale={locale}
                          priority={groupIndex === 0 && index < 4}
                        />
                      ))}
                    </ul>
                  </section>
                ))}

                <p className="mt-16 max-w-2xl text-sm leading-relaxed text-inkMuted">
                  {t.taxNote}
                </p>
              </div>
            </div>
          </>
        )}
      </main>

      <SiteFooter locale={locale} preview={preview} />
    </div>
  );
}
