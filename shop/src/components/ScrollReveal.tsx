"use client";

import { useEffect } from "react";

/**
 * One observer for the whole page rather than a wrapper component per element:
 * anything marked `data-reveal` fades up as it enters, then stops being watched.
 *
 * Deliberately not a library. These are fades; Motion or GSAP would add tens of
 * kilobytes to do what four lines of CSS already do, and the skill reserves GSAP
 * for pinning and scrubbing, which this page does not need.
 */
export default function ScrollReveal() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) return;

    // Only now does the CSS start hiding anything.
    document.documentElement.classList.add("khla-reveal-ready");
    const nodes = document.querySelectorAll<HTMLElement>("[data-reveal]");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          // A jump (anchor link, restored scroll position, skip link) can take
          // an element from below the viewport to above it without ever
          // producing an intersecting frame. Reveal anything we have scrolled
          // past, or it stays invisible for good.
          const scrolledPast = entry.boundingClientRect.bottom < 0;
          if (!entry.isIntersecting && !scrolledPast) continue;
          const el = entry.target as HTMLElement;
          // Siblings in the same group cascade rather than landing together.
          const index = Number(el.dataset.revealIndex ?? 0);
          // No stagger for something the reader has already passed.
          el.style.setProperty("--khla-delay", scrolledPast ? "0ms" : `${Math.min(index, 6) * 70}ms`);
          el.classList.add("is-in");
          observer.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
    );

    nodes.forEach((n) => {
      // Anything already on screen at load should not wait for a scroll.
      if (n.getBoundingClientRect().top < window.innerHeight) {
        n.classList.add("is-in");
      } else {
        observer.observe(n);
      }
    });

    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("khla-reveal-ready");
    };
  }, []);

  return null;
}
