"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { assetUrl, previewCopy, type Locale, type PreviewImage } from "@/lib/preview-catalog";

type Props = {
  images: PreviewImage[];
  locale: Locale;
};

/**
 * One scroll-snap track serves both gestures people expect: swipe on a phone,
 * click a thumbnail on a desktop. Native scrolling keeps the momentum and the
 * accessibility of a normal list instead of reimplementing either.
 */
export default function ProductGallery({ images, locale }: Props) {
  const t = previewCopy[locale];
  const trackRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);

  const show = useCallback((index: number) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollTo({ left: index * track.clientWidth, behavior: "smooth" });
    setActive(index);
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setActive(Math.round(track.scrollLeft / Math.max(track.clientWidth, 1)));
      });
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      track.removeEventListener("scroll", onScroll);
    };
  }, []);

  const single = images.length === 1;

  return (
    <div>
      <ul
        ref={trackRef}
        aria-label={t.galleryLabel}
        className={`flex snap-x snap-mandatory overflow-x-auto rounded-2xl bg-[#FEFEFE] [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          single ? "overflow-x-hidden" : ""
        }`}
      >
        {images.map((image, index) => (
          <li key={image.file} className="w-full shrink-0 snap-center">
            {/* Supplier mockups arrive in several aspect ratios on a white
                field, so the tile matches that white and contains rather than
                crops. Nothing is cut off and every tile is the same height. */}
            <div className="aspect-square p-6 sm:p-10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={assetUrl(image.file)}
                alt={image.alt[locale]}
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : undefined}
                className="h-full w-full object-contain"
              />
            </div>
          </li>
        ))}
      </ul>

      {!single && (
        <ul className="mt-3 flex gap-3">
          {images.map((image, index) => (
            <li key={image.file}>
              <button
                type="button"
                onClick={() => show(index)}
                aria-current={index === active ? "true" : undefined}
                aria-label={image.alt[locale]}
                className={`block w-20 overflow-hidden rounded-xl bg-[#FEFEFE] ring-1 transition sm:w-24 ${
                  index === active
                    ? "ring-2 ring-navy"
                    : "ring-line hover:ring-ink/30"
                }`}
              >
                <span className="block aspect-square p-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={assetUrl(image.file)}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-contain"
                  />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
