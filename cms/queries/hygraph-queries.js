/**
 * Hygraph GraphQL Queries — Keep Her Light Alive Foundation
 * Use these in your static-site build step or client-side fetch.
 *
 * All queries target stage: PUBLISHED by default.
 * Set HYGRAPH_STAGE=DRAFT for preview/staging builds.
 *
 * Base fetcher (copy into your build script or translations.js):
 *
 *   async function hygraphFetch(query, variables = {}) {
 *     const res = await fetch(process.env.HYGRAPH_ENDPOINT, {
 *       method: 'POST',
 *       headers: {
 *         'Content-Type': 'application/json',
 *         Authorization: `Bearer ${process.env.HYGRAPH_TOKEN}`,
 *       },
 *       body: JSON.stringify({ query, variables }),
 *     });
 *     const { data, errors } = await res.json();
 *     if (errors) throw new Error(JSON.stringify(errors));
 *     return data;
 *   }
 */

// ─────────────────────────────────────────────────────────────
// 1. Global Site Settings (header/footer/SEO defaults)
//    Called once per build; cache for 15 min in runtime fetches.
// ─────────────────────────────────────────────────────────────
const GLOBAL_SETTINGS_QUERY = /* GraphQL */ `
  query GlobalSettings($stage: Stage! = PUBLISHED, $locale: Locale! = en) {
    globalSiteSetting(stage: $stage, locales: [$locale]) {
      siteName
      primaryEmail
      primaryPhone
      locationText
      donateUrl
      instagramUrl
      facebookUrl
      footerText
      seoDefaultTitle
      seoDefaultDescription
      ogImage {
        url
        alt: fileName
      }
    }
  }
`;
// Example response:
// { globalSiteSetting: { siteName: "Keep Her Light Alive Foundation", primaryEmail: "...", ... } }

// ─────────────────────────────────────────────────────────────
// 2. Page by Slug (loads all sections + nested relations)
// ─────────────────────────────────────────────────────────────
const PAGE_BY_SLUG_QUERY = /* GraphQL */ `
  query PageBySlug($slug: String!, $stage: Stage! = PUBLISHED, $locale: Locale! = en) {
    page(where: { slug: $slug }, stage: $stage, locales: [$locale]) {
      slug
      title
      seoTitle
      seoDescription
      ogImage { url fileName }
      sections {
        __typename
        ... on RichTextSection {
          heading
          body { html }
          image { url alt: fileName }
          ctaLabel
          ctaUrl
        }
        ... on CardsSection {
          heading
          cards(orderBy: sortOrder_ASC) {
            id
            title
            summary
            coverImage { url fileName }
            ctaLabel
            ctaUrl
            isFeatured
          }
        }
        ... on SplitSection {
          heading
          body { html }
          image { url alt: fileName }
          imagePosition
          ctaLabel
          ctaUrl
        }
        ... on QuoteSection {
          quoteText
          quoteAttribution
        }
        ... on FAQSection {
          heading
          faqs(orderBy: sortOrder_ASC) {
            id
            question
            answer { html }
          }
        }
        ... on FoundersSection {
          heading
          founders(orderBy: sortOrder_ASC) {
            id
            name
            roleTitle
            photo { url alt: fileName }
            bio { html }
          }
        }
      }
    }
  }
`;

// ─────────────────────────────────────────────────────────────
// 3. Events List (upcoming first; falls back to empty array → show "Coming Soon")
// ─────────────────────────────────────────────────────────────
const EVENTS_QUERY = /* GraphQL */ `
  query UpcomingEvents($now: DateTime!, $stage: Stage! = PUBLISHED, $locale: Locale! = en) {
    events(
      stage: $stage
      locales: [$locale]
      where: {
        OR: [{ isPublic: true }, { isPublic: null }]
        status_in: [planned, scheduled]
        startDateTime_gte: $now
      }
      orderBy: startDateTime_ASC
      first: 20
    ) {
      id
      title
      status
      startDateTime
      endDateTime
      timezone
      locationName
      locationAddress
      city
      registrationUrl
      description { html }
      coverImage { url fileName }
    }
  }
`;
// Usage: pass variables: { now: new Date().toISOString() }
// If events array is empty → render "Calendar Coming Soon" UI block.

// ─────────────────────────────────────────────────────────────
// 4. Resources List (featured first, then by sortOrder)
// ─────────────────────────────────────────────────────────────
const RESOURCES_QUERY = /* GraphQL */ `
  query Resources($stage: Stage! = PUBLISHED, $locale: Locale! = en) {
    resources(
      stage: $stage
      locales: [$locale]
      orderBy: sortOrder_ASC
      first: 50
    ) {
      id
      title
      type
      category
      description
      file { url fileName mimeType }
      url
      sourceLabel
      isFeatured
    }
  }
`;
// Filter by category on the client:
//   const checklists = resources.filter(r => r.category === 'checklist');

// ─────────────────────────────────────────────────────────────
// 5. Legal Page by Slug
// ─────────────────────────────────────────────────────────────
const LEGAL_PAGE_QUERY = /* GraphQL */ `
  query LegalPage($slug: String!, $stage: Stage! = PUBLISHED, $locale: Locale! = en) {
    legalPage(where: { slug: $slug }, stage: $stage, locales: [$locale]) {
      slug
      title
      lastUpdated
      body { html }
    }
  }
`;

// ─────────────────────────────────────────────────────────────
// 6. Contact Topics (for form dropdown)
// ─────────────────────────────────────────────────────────────
const CONTACT_TOPICS_QUERY = /* GraphQL */ `
  query ContactTopics($stage: Stage! = PUBLISHED, $locale: Locale! = en) {
    contactTopics(stage: $stage, locales: [$locale], orderBy: sortOrder_ASC) {
      label
      value
    }
  }
`;

// ─────────────────────────────────────────────────────────────
// 7. Coin Initiative Settings (singleton)
// ─────────────────────────────────────────────────────────────
const COIN_SETTINGS_QUERY = /* GraphQL */ `
  query CoinInitiativeSettings($stage: Stage! = PUBLISHED, $locale: Locale! = en) {
    coinInitiativeSetting(stage: $stage, locales: [$locale]) {
      heading
      body { html }
      qrCodeImage { url }
      coinFrontImage { url }
      requestCoinCtaUrl
      donateCtaUrl
    }
  }
`;

// ─────────────────────────────────────────────────────────────
// Rendering Strategy — Section Union Dispatch
// ─────────────────────────────────────────────────────────────
/*
  In your build script (Node.js) or client JS:

  function renderSection(section) {
    switch (section.__typename) {
      case 'RichTextSection':
        return renderRichTextSection(section);
      case 'CardsSection':
        return renderCardsSection(section);
      case 'SplitSection':
        return renderSplitSection(section);
      case 'QuoteSection':
        return renderQuoteSection(section);
      case 'FAQSection':
        return renderFAQSection(section);
      case 'FoundersSection':
        return renderFoundersSection(section);
      default:
        console.warn('Unknown section type:', section.__typename);
        return '';
    }
  }

  Safe Rich Text rendering — use the .html field from Hygraph.
  Sanitize with DOMPurify before innerHTML injection:

  import DOMPurify from 'dompurify';
  element.innerHTML = DOMPurify.sanitize(section.body.html);

  Or for Node.js build-time static injection, use:
  import { sanitize } from 'isomorphic-dompurify';

  Defensive rendering rules:
  - Always check field existence before rendering: section.image?.url
  - If sections array is empty, render a safe "no content" placeholder
  - Optional CTAs: only render <a> if ctaLabel && ctaUrl are both set
  - Events empty array: render the hardcoded "Calendar Coming Soon" block
  - Resources: derive icon from type: pdf→file-text, link→external-link, video→youtube
*/

module.exports = {
  GLOBAL_SETTINGS_QUERY,
  PAGE_BY_SLUG_QUERY,
  EVENTS_QUERY,
  RESOURCES_QUERY,
  LEGAL_PAGE_QUERY,
  CONTACT_TOPICS_QUERY,
  COIN_SETTINGS_QUERY,
};
