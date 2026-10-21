"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { previewCopy, type Locale } from "@/lib/preview-catalog";

const KEY = "preferredLanguage";

type Props = {
  locale: Locale;
  /** Path within the shop, so switching language stays on this page. */
  path: string;
};

/**
 * The main site stores the visitor's language in localStorage under
 * `preferredLanguage` and has no URL parameter. The shop is driven by
 * `?lang=`, so without this bridge a Spanish reader crossing into /shop lands
 * back in English. Reads that key on arrival and writes it on every switch.
 */
export default function LanguageLinks({ locale, path }: Props) {
  const t = previewCopy[locale];
  const router = useRouter();

  useEffect(() => {
    // The root layout is static, so the <html lang> has to be corrected here
    // for the Spanish pages.
    document.documentElement.lang = locale;

    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(KEY);
    } catch {
      return;
    }
    const asked = new URLSearchParams(window.location.search).has("lang");
    if (!asked && stored === "es" && locale !== "es") {
      router.replace(`${path}?lang=es`);
    }
  }, [locale, path, router]);

  function remember(next: Locale) {
    try {
      window.localStorage.setItem(KEY, next);
    } catch {
      // Private browsing: the choice still applies to this page via the URL.
    }
  }

  return (
    <nav
      aria-label={t.languageLabel}
      className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em]"
    >
      <Link
        href={path}
        hrefLang="en"
        onClick={() => remember("en")}
        aria-current={locale === "en" ? "true" : undefined}
        className={`px-1.5 py-2 ${locale === "en" ? "text-ink" : "text-inkSoft hover:text-ink"}`}
      >
        EN
      </Link>
      <span aria-hidden="true" className="text-ink/25">
        /
      </span>
      <Link
        href={`${path}?lang=es`}
        hrefLang="es"
        onClick={() => remember("es")}
        aria-current={locale === "es" ? "true" : undefined}
        className={`px-1.5 py-2 ${locale === "es" ? "text-ink" : "text-inkSoft hover:text-ink"}`}
      >
        ES
      </Link>
    </nav>
  );
}
