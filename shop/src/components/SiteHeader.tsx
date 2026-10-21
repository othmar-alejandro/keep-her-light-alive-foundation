import Link from "next/link";
import CartDrawer from "@/components/CartDrawer";
import LanguageLinks from "@/components/LanguageLinks";
import { catalogHref, foundationUrl, previewCopy, type Locale } from "@/lib/preview-catalog";
import type { BagIndex } from "@/lib/bag";

type Props = {
  locale: Locale;
  index: BagIndex;
  /** Path within the shop, so the language switch stays on this page. */
  path: string;
};

export default function SiteHeader({ locale, index, path }: Props) {
  const t = previewCopy[locale];

  return (
    <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-6 lg:px-12">
        <Link href={catalogHref(locale)} className="font-display text-lg font-semibold tracking-[0.02em]">
          {t.brand}
        </Link>

        {/* The foundation site is a separate static app at the domain root.
            next/link would prepend basePath and point back into the shop. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href={foundationUrl()}
          className="ml-2 hidden py-2 text-xs font-medium text-inkMuted underline-offset-4 hover:text-ink hover:underline sm:block"
        >
          {t.foundationHome}
        </a>

        <div className="ml-auto flex items-center gap-3">
          <LanguageLinks locale={locale} path={path} />
          <CartDrawer index={index} locale={locale} />
        </div>
      </div>
    </header>
  );
}
