import { previewCopy, type Locale } from "@/lib/preview-catalog";

/** Stays up until prices are confirmed and checkout is live. */
export default function PreviewBanner({ locale }: { locale: Locale }) {
  const t = previewCopy[locale];
  return (
    <div className="bg-navy text-sand">
      <p className="mx-auto max-w-[1400px] px-6 py-2.5 text-center text-xs leading-5 lg:px-12">
        <span className="mr-2 font-semibold uppercase tracking-[0.18em] text-gold">
          {t.noticeLabel}
        </span>
        {t.notice}
      </p>
    </div>
  );
}
