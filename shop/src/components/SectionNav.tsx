"use client";

import { useEffect, useRef, useState } from "react";

type Section = { id: string; label: string };

/**
 * Jump links for the catalog's sections, pinned under the header. The active
 * chip tracks the section you are actually looking at, so the nav answers
 * "where am I" as well as "where can I go".
 */
export default function SectionNav({
  sections,
  label,
}: {
  sections: Section[];
  label: string;
}) {
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      // Only the band just below the sticky header counts as "current".
      { rootMargin: "-120px 0px -65% 0px", threshold: 0 },
    );
    for (const section of sections) {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    }
    return () => observer.disconnect();
  }, [sections]);

  // Keep the active chip in view when the row has to scroll on a phone.
  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-chip="${active}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [active]);

  return (
    <nav
      aria-label={label}
      className="sticky top-16 z-20 border-y border-gray-100 bg-white/95 backdrop-blur"
    >
      <ul
        ref={listRef}
        className="mx-auto flex max-w-[1400px] gap-2 overflow-x-auto px-6 py-2.5 lg:px-12 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              data-chip={section.id}
              aria-current={active === section.id ? "true" : undefined}
              className={`inline-block whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] transition ${
                active === section.id
                  ? "bg-navy text-sand"
                  : "bg-sand text-inkMuted hover:text-ink"
              }`}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
