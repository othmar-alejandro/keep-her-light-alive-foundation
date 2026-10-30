import type { Config } from "tailwindcss";

/**
 * Tokens mirror the live foundation site. Contrast is not a matter of taste
 * here: PRODUCT.md requires WCAG 2.1 AA, and gold on a light background is
 * 1.9:1. The two gold tokens are therefore not interchangeable —
 *   gold     paints surfaces and rules, never text on light
 *   goldInk  is the only gold allowed as text (5.5:1 on sand, 6.0:1 on white)
 * Muted ink below 60% opacity fails AA for small text; use inkMuted/inkSoft.
 */
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        gold: "#D4AF37",
        goldInk: "#7A6010",
        navy: "#0D2E47",
        sand: "#F5F5F0",
        slate: "#F8FAFC",
        ink: "#111111",
        inkMuted: "#5A5A55",
        inkSoft: "#6E6E68",
        line: "#E4E4DC",
      },
      fontFamily: {
        display: ["var(--font-playfair)"],
        sans: ["var(--font-inter)"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(13,46,71,0.04), 0 8px 24px -16px rgba(13,46,71,0.18)",
        lift: "0 2px 4px rgba(13,46,71,0.05), 0 18px 40px -22px rgba(13,46,71,0.30)",
        drawer: "-24px 0 60px -30px rgba(13,46,71,0.45)",
      },
    },
  },
  plugins: [],
};

export default config;
