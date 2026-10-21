import Link from "next/link";
import PreviewBanner from "@/components/PreviewBanner";
import ProductCard from "@/components/ProductCard";
import CategoryRail from "@/components/CategoryRail";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { getStorefrontCatalog } from "@/lib/hygraph-catalog";
import {
  buildBagIndex,
  catalogHref,
  groupByCategory,
  isCategory,
  previewCopy,
  type Locale,
} from "@/lib/preview-catalog";

type AllPageProps = {
  searchParams: Promise<{ lang?: string; cat?: string }>;
};

export default async function AllProductsPage({ searchParams }: AllPageProps) {
  const { lang, cat } = await searchParams;
  const locale: Locale = lang === "es" ? "es" : "en";
  const t = previewCopy[locale];
  const { products, preview, error } = await getStorefrontCatalog();
  const allGroups = groupByCategory(products);
  // An unknown ?cat simply shows everything rather than an empty shelf.
  const active = isCategory(cat) ? cat : null;
  const groups = active
    ? allGroups.filter((group) => group.category === active)
    : allGroups;
  // Counts come from the unfiltered catalog, so the rail does not renumber
  // itself every time a category is chosen.
  const counts = allGroups.map((group) => ({
    category: group.category,
    count: group.products.length,
  }));

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-5 focus:py-2 focus:text-sm focus:font-semibold focus:text-sand"
      >
        {t.skipToContent}
      </a>

      {preview && <PreviewBanner locale={locale} />}
      <SiteHeader locale={locale} index={buildBagIndex(products, locale)} path="/all" />

      <main id="main" className="flex-1">
        <section className="mx-auto max-w-[1400px] px-6 pb-12 pt-14 lg:px-12 lg:pt-20">
          <nav aria-label={t.breadcrumbLabel}>
            <ol className="flex flex-wrap items-center gap-1.5 text-xs text-inkMuted">
              <li>
                <Link href={catalogHref(locale)} className="inline-block py-1.5 hover:text-ink hover:underline">
                  {t.heroEyebrow}
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-ink">{t.allProducts}</li>
            </ol>
          </nav>
          <h1 className="mt-3 max-w-3xl font-display text-4xl leading-[1.1] text-ink md:text-5xl">
            {t.allProducts}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-inkMuted">{t.heroBody}</p>
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
            {/* Sand band with white cards — the live site's own product recipe. */}
            <div id="catalog" className="border-t border-gray-100 bg-sand">
              <div className="mx-auto grid max-w-[1400px] gap-x-10 px-6 pb-20 pt-8 lg:grid-cols-[200px_minmax(0,1fr)] lg:px-12 lg:pt-12">
                <CategoryRail
                  counts={counts}
                  total={products.length}
                  active={active}
                  locale={locale}
                />

                {/* The chip row sits above the grid on a phone, so it needs
                    air the desktop rail does not. */}
                <div className="mt-8 min-w-0 lg:mt-0">
                {groups.map((group, groupIndex) => (
                  <section
                    key={group.category}
                    id={group.category}
                    aria-labelledby={`${group.category}-heading`}
                    className="scroll-mt-32 pt-10 first:pt-0 lg:pt-16"
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
            </div>
          </>
        )}
      </main>

      <SiteFooter locale={locale} preview={preview} />
    </div>
  );
}
