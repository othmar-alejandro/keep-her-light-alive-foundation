import { previewCopy, type Locale } from "@/lib/preview-catalog";

/** Four facts about how ordering works. Heading is editable in Hygraph. */
export default function ValueRow({ locale, heading }: { locale: Locale; heading: string }) {
  const t = previewCopy[locale];
  return (
    <section className="border-y border-gray-100 bg-sand">
      <div className="mx-auto max-w-[1400px] px-6 py-14 lg:px-12 lg:py-16">
        <h2
          data-reveal
          className="font-display text-[clamp(1.75rem,3vw,2.25rem)] font-normal leading-[1.1] tracking-[-0.02em]"
        >
          {heading}
        </h2>
        <ul className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {t.values.map((value, index) => (
            <li key={value.title} data-reveal data-reveal-index={index}>
              <h3 className="font-display text-lg leading-snug">{value.title}</h3>
              <p className="mt-2 text-sm leading-6 text-inkMuted">{value.body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
