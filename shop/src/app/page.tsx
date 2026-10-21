import CategoryTiles from "@/components/CategoryTiles";
import FeaturedRows from "@/components/FeaturedRows";
import HeroBanner from "@/components/HeroBanner";
import PreviewBanner from "@/components/PreviewBanner";
import ScrollReveal from "@/components/ScrollReveal";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import StoryBand from "@/components/StoryBand";
import ValueRow from "@/components/ValueRow";
import { getStorefrontCatalog } from "@/lib/hygraph-catalog";
import { getShopSections, orderedSections } from "@/lib/hygraph-sections";
import {
  buildBagIndex,
  featuredProducts,
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

  const [{ products, preview, error }, sections] = await Promise.all([
    getStorefrontCatalog(),
    getShopSections(locale),
  ]);
  const groups = groupByCategory(products);
  const featured = featuredProducts(products, sections.featured.itemLimit ?? 6);

  return (
    <div className="flex min-h-screen flex-col bg-white text-ink">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ink focus:px-5 focus:py-2 focus:text-sm focus:font-semibold focus:text-sand"
      >
        {t.skipToContent}
      </a>

      <ScrollReveal />
      {preview && <PreviewBanner locale={locale} />}
      <SiteHeader locale={locale} index={buildBagIndex(products, locale)} path="/" />

      <main id="main" className="flex-1">
        {error && (
          <p role="alert" className="mx-auto max-w-[1400px] px-6 py-20 text-sm lg:px-12">
            {t.catalogError}
          </p>
        )}
        {!error && products.length === 0 && (
          <p className="mx-auto max-w-[1400px] px-6 py-20 text-sm lg:px-12">{t.catalogReady}</p>
        )}

        {/* Order and visibility come from Hygraph: an editor can hide a section
            or move it without a deploy. Anything they have not set falls back
            to the copy this build ships with. */}
        {orderedSections(sections).map((section) => {
          if (section.key === "hero") {
            return <HeroBanner key={section.key} locale={locale} section={section} />;
          }
          if (products.length === 0) return null;
          switch (section.key) {
            case "featured":
              return (
                <section
                  key={section.key}
                  id="featured"
                  className="mx-auto max-w-[1400px] scroll-mt-24 px-6 py-16 lg:px-12 lg:py-24"
                >
                  {section.eyebrow && (
                    <span className="block text-xs font-bold uppercase tracking-[0.2em] text-goldInk">
                      {section.eyebrow}
                    </span>
                  )}
                  <h2
                    data-reveal
                    className="max-w-3xl font-display text-[clamp(2rem,4.2vw,3.25rem)] font-normal leading-[1.05] tracking-[-0.02em]"
                  >
                    {section.heading}
                  </h2>
                  <FeaturedRows products={featured} locale={locale} preview={preview} />
                </section>
              );
            case "categories":
              return (
                <CategoryTiles
                  key={section.key}
                  groups={groups}
                  locale={locale}
                  total={products.length}
                  heading={section.heading}
                />
              );
            case "values":
              return <ValueRow key={section.key} locale={locale} heading={section.heading} />;
            case "story":
              return <StoryBand key={section.key} locale={locale} section={section} />;
            default:
              return null;
          }
        })}
      </main>

      <SiteFooter locale={locale} preview={preview} />
    </div>
  );
}
