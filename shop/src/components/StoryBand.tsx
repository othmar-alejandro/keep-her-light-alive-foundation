import { assetUrl, foundationUrl, previewCopy, type Locale } from "@/lib/preview-catalog";
import type { Section } from "@/lib/hygraph-sections";

/**
 * Her story, on its own dark band, with no Buy button anywhere in it: the
 * portrait and the cart never share a frame. Copy and photo are editable.
 */
export default function StoryBand({ locale, section }: { locale: Locale; section: Section }) {
  const t = previewCopy[locale];
  const image = section.image ?? assetUrl("stephanie.jpg");

  return (
    <section className="bg-navy text-sand">
      <div className="mx-auto grid max-w-[1400px] items-stretch gap-0 lg:grid-cols-2">
        <div className="relative min-h-[18rem] lg:min-h-[32rem]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={t.storyPortraitAlt}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-[50%_28%]"
          />
        </div>
        <div className="flex flex-col justify-center px-6 py-14 lg:px-16 lg:py-20">
          {section.eyebrow && (
            <span data-reveal className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
              {section.eyebrow}
            </span>
          )}
          <h2
            data-reveal
            className="mt-5 font-display text-[clamp(2rem,3.4vw,2.75rem)] font-normal leading-[1.08] tracking-[-0.02em]"
          >
            {section.heading}
          </h2>
          <p data-reveal className="mt-5 max-w-xl text-base font-light leading-relaxed text-sand/80 sm:text-lg">
            {section.body}
          </p>
          {section.ctaLabel && (
            <a
              data-reveal
              href={foundationUrl(section.ctaUrl || "/#legacy")}
              className="mt-8 inline-flex w-fit items-center gap-2 border-b-2 border-gold pb-1 text-sm font-semibold text-gold transition hover:border-sand hover:text-sand"
            >
              {section.ctaLabel}
              <span aria-hidden="true">&rarr;</span>
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
