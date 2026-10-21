import Link from "next/link";
import {
  CATEGORIES,
  foundationUrl,
  previewCopy,
  sectionHref,
  type Locale,
} from "@/lib/preview-catalog";

/**
 * Mirrors the live site's footer: black field, logo medallion, tagline,
 * social circles, two link columns, OAC credit. Links that leave the shop are
 * plain anchors — basePath is /shop, so next/link would rewrite them back in.
 */
const CONTACT = {
  email: "Keepherlightalivesmr@gmail.com",
  phone: "786-874-1881",
  instagram: "https://instagram.com/keepherlightalive",
};

const MENU = [
  { href: "/#mission", en: "Mission", es: "Misión" },
  { href: "/#legacy", en: "Legacy", es: "Legado" },
  { href: "/#resources", en: "Resources", es: "Recursos" },
  { href: "/privacy-policy.html", en: "Privacy Policy", es: "Política de Privacidad" },
  { href: "/terms-of-use.html", en: "Terms of Use", es: "Términos de Uso" },
];

export default function SiteFooter({
  locale,
  preview,
}: {
  locale: Locale;
  preview: boolean;
}) {
  const t = previewCopy[locale];
  const pick = (link: { en: string; es: string }) => (locale === "es" ? link.es : link.en);

  return (
    <footer className="bg-black px-6 pb-12 pt-24 text-white lg:px-12">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-20 flex flex-col items-start justify-between gap-16 lg:flex-row">
          <div className="max-w-md">
            <h2 className="font-display text-2xl">Keep Her Light Alive</h2>
            <p className="mt-6 leading-relaxed text-gray-400">{t.impact}</p>
            <div className="mt-8 flex gap-4">
              <a
                href={CONTACT.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-800 transition hover:bg-white hover:text-black"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="3" width="18" height="18" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </a>
              <a
                href={`mailto:${CONTACT.email}`}
                aria-label={CONTACT.email}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-800 transition hover:bg-white hover:text-black"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="m3.5 7 8.5 6 8.5-6" />
                </svg>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-12 sm:gap-16">
            <nav aria-label={t.h1}>
              <h3 className="mb-6 font-medium text-white">{t.h1}</h3>
              <ul className="space-y-4 text-sm text-gray-400">
                {CATEGORIES.map((category) => (
                  <li key={category}>
                    <Link href={sectionHref(category, locale)} className="inline-block py-1 transition hover:text-white">
                      {t.category[category]}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <nav aria-label={t.foundationHome}>
              <h3 className="mb-6 font-medium text-white">{t.foundationHome}</h3>
              <ul className="space-y-4 text-sm text-gray-400">
                {MENU.map((link) => (
                  <li key={link.href}>
                    <a href={foundationUrl(link.href)} className="inline-block py-1 transition hover:text-white">
                      {pick(link)}
                    </a>
                  </li>
                ))}
                <li>
                  <a href={`mailto:${CONTACT.email}`} className="inline-block break-all py-1 transition hover:text-gold">
                    {CONTACT.email}
                  </a>
                </li>
                <li>
                  <a href={`tel:${CONTACT.phone}`} className="inline-block py-1 transition hover:text-gold">
                    {CONTACT.phone}
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        <div className="border-t border-gray-900 pt-8">
          <p className="text-sm leading-6 text-gray-400">{preview ? t.footer : t.footerOpen}</p>
          <div className="mt-4 flex flex-col justify-between gap-2 text-xs uppercase tracking-[0.1em] text-gray-400 md:flex-row">
            <p>&copy; 2026 Keep Her Light Alive Foundation, Inc.</p>
            <p>Designed by OAC Digital Innovations</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
