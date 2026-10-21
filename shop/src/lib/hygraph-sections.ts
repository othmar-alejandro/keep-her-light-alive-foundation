import { previewCopy, type Locale } from "@/lib/preview-catalog";

/** The storefront sections an editor can control, in their default order. */
export const SECTION_KEYS = ["hero", "featured", "categories", "values", "story"] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

export type Section = {
  key: SectionKey;
  visible: boolean;
  order: number;
  eyebrow: string;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  image: string | null;
  itemLimit: number | null;
};

type CmsSection = {
  sectionKey: string | null;
  isVisible: boolean | null;
  sortOrder: number | null;
  eyebrowEn: string | null; eyebrowEs: string | null;
  headingEn: string | null; headingEs: string | null;
  bodyEn: string | null; bodyEs: string | null;
  ctaLabelEn: string | null; ctaLabelEs: string | null;
  ctaUrl: string | null;
  itemLimit: number | null;
  image: { url: string } | null;
};

const query = `query ShopSections {
  shopSections(stage: PUBLISHED, first: 50, orderBy: sortOrder_ASC) {
    sectionKey isVisible sortOrder
    eyebrowEn eyebrowEs headingEn headingEs bodyEn bodyEs
    ctaLabelEn ctaLabelEs ctaUrl itemLimit
    image { url }
  }
}`;

/** Only the Foundation's own asset host is ever rendered. */
function trusted(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" &&
      (parsed.hostname === "graphassets.com" || parsed.hostname.endsWith(".graphassets.com"));
  } catch {
    return false;
  }
}

/**
 * A CTA from the CMS may only point back into this site. Anything else, and an
 * editor account becomes the authority on where the page's own buttons lead.
 */
function safePath(value: string | null): string | null {
  if (!value) return null;
  return /^\/(?![/\\])[\w\-./#?=&%]*$/.test(value) ? value : null;
}

/** What the page falls back to when the CMS has nothing to say about a section. */
function builtIn(key: SectionKey, locale: Locale): Section {
  const t = previewCopy[locale];
  const base = { key, visible: true, image: null, itemLimit: null, ctaUrl: "" };
  switch (key) {
    case "hero":
      return { ...base, order: 1, eyebrow: t.heroEyebrow,
        heading: `${t.heroTitleLead} ${t.heroTitleAccent}`, body: t.heroBodyShort,
        ctaLabel: t.heroCta, ctaUrl: "/all" };
    case "featured":
      return { ...base, order: 2, eyebrow: "", heading: t.featuredHeading, body: "",
        ctaLabel: "", itemLimit: 6 };
    case "categories":
      return { ...base, order: 3, eyebrow: "", heading: t.categoryHeading, body: "", ctaLabel: "" };
    case "values":
      return { ...base, order: 4, eyebrow: "", heading: t.valueHeading, body: "", ctaLabel: "" };
    case "story":
      return { ...base, order: 5, eyebrow: t.storyEyebrow, heading: t.storyHeading,
        body: t.storyBody, ctaLabel: t.storyLink, ctaUrl: "/#legacy" };
  }
}

export type ShopSections = Record<SectionKey, Section>;

function isKnownKey(value: string | null): value is SectionKey {
  return SECTION_KEYS.includes(value as SectionKey);
}

/**
 * Section settings from the CMS, merged over the built-in defaults. A section
 * the editor has not created, or a field they left blank, keeps the shipped
 * copy, so the storefront can never render empty because of a missing row.
 */
export async function getShopSections(locale: Locale): Promise<ShopSections> {
  const defaults = Object.fromEntries(
    SECTION_KEYS.map((key) => [key, builtIn(key, locale)]),
  ) as ShopSections;

  const endpoint = process.env.HYGRAPH_ENDPOINT;
  if (!endpoint) return defaults;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.HYGRAPH_TOKEN ? { Authorization: `Bearer ${process.env.HYGRAPH_TOKEN}` } : {}),
      },
      body: JSON.stringify({ query }),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Hygraph HTTP ${response.status}`);
    const result = (await response.json()) as {
      data?: { shopSections?: CmsSection[] };
      errors?: unknown[];
    };
    if (result.errors?.length || !Array.isArray(result.data?.shopSections)) return defaults;

    for (const row of result.data.shopSections) {
      if (!isKnownKey(row.sectionKey)) continue;
      // Always the shipped copy, never the previous row's merge: two rows with
      // the same key must not let the first one supply the second one's blanks.
      const fallback = builtIn(row.sectionKey, locale);
      const pick = (en: string | null, es: string | null, or: string) => {
        // A field holding only spaces is a field the editor left blank.
        const chosen = (locale === "es" ? es || en : en)?.trim();
        return chosen || or;
      };
      const image = row.image?.url;
      defaults[row.sectionKey] = {
        key: row.sectionKey,
        visible: row.isVisible !== false,
        order: row.sortOrder ?? fallback.order,
        eyebrow: pick(row.eyebrowEn, row.eyebrowEs, fallback.eyebrow),
        heading: pick(row.headingEn, row.headingEs, fallback.heading),
        body: pick(row.bodyEn, row.bodyEs, fallback.body),
        ctaLabel: pick(row.ctaLabelEn, row.ctaLabelEs, fallback.ctaLabel),
        ctaUrl: safePath(row.ctaUrl) ?? fallback.ctaUrl,
        image: image && trusted(image) ? image : null,
        itemLimit:
          Number.isSafeInteger(row.itemLimit) && (row.itemLimit as number) > 0
            ? row.itemLimit
            : fallback.itemLimit,
      };
    }
    return defaults;
  } catch (error) {
    console.error("Shop sections unavailable, using built-in copy:", error);
    return defaults;
  }
}

/** Visible sections in the editor's order. */
export function orderedSections(sections: ShopSections): Section[] {
  return SECTION_KEYS.map((key) => sections[key])
    .filter((section) => section.visible)
    .sort((a, b) => a.order - b.order);
}
