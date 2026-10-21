import Link from "next/link";
import {
  allHref,
  assetUrl,
  foundationUrl,
  previewCopy,
  type Locale,
} from "@/lib/preview-catalog";
import type { Section } from "@/lib/hygraph-sections";

/**
 * Asymmetric split: photograph full bleed, type held in the left third over a
 * directional scrim. Replaces the drawn sunrise, which was a gradient and an
 * SVG standing in for a photo.
 *
 * The scrim is directional rather than a flat overlay so the right side of the
 * frame keeps its light. Contrast over the type zone is measured, not assumed.
 */
export default function HeroBanner({ locale, section }: { locale: Locale; section: Section }) {
  const t = previewCopy[locale];
  // The accent is the last word of the heading, so an editor can rewrite the
  // line in either language and still get the gold italic on its final word.
  const words = section.heading.trim().split(/\s+/);
  const accent = words.length > 1 ? words.pop()! : "";
  const lead = words.join(" ");
  const image = section.image ?? assetUrl("hero-boat.jpg");

  return (
    <section className="khla-hero relative isolate overflow-hidden bg-[#0B2742]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image}
        alt={t.heroImageAlt}
        fetchPriority="high"
        className="absolute inset-0 -z-20 h-full w-full object-cover object-[62%_center]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(100deg, rgba(6,20,34,.94) 0%, rgba(6,20,34,.88) 42%, rgba(6,20,34,.55) 62%, rgba(6,20,34,.16) 82%, rgba(6,20,34,0) 100%)",
        }}
      />

      <div className="mx-auto flex min-h-[32rem] max-w-[1400px] items-center px-6 pb-16 pt-20 lg:min-h-[38rem] lg:px-12 lg:pb-20 lg:pt-24">
        <div className="max-w-xl">
          <span className="khla-rise block text-xs font-bold uppercase tracking-[0.2em] text-gold">
            {section.eyebrow}
          </span>
          <h1 className="khla-rise mt-5 font-display text-[clamp(2.75rem,6vw,4.5rem)] font-normal leading-[1.04] tracking-[-0.02em] text-white [animation-delay:80ms]">
            {lead}{" "}
            {/* Italic descender on "light." needs the extra leading and reserve. */}
            <span className="inline-block pb-1 italic leading-[1.1] text-gold">
              {accent}
            </span>
          </h1>
          <p className="khla-rise mt-5 max-w-md text-base font-light leading-7 text-white/85 [animation-delay:160ms] sm:text-lg">
            {section.body}
          </p>
          <div className="khla-rise mt-9 flex flex-wrap items-center gap-3 [animation-delay:240ms]">
            <Link
              href={section.ctaUrl === "/all" ? allHref(locale) : section.ctaUrl || allHref(locale)}
              className="inline-flex items-center rounded-full bg-gold px-8 py-4 text-sm font-bold text-black transition hover:bg-white active:translate-y-px"
            >
              {section.ctaLabel}
            </Link>
            <a
              href={foundationUrl("/#mission")}
              className="inline-flex items-center rounded-full border-2 border-white/70 px-7 py-4 text-sm font-semibold text-white transition hover:bg-white hover:text-ink active:translate-y-px"
            >
              {t.heroSecondary}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
