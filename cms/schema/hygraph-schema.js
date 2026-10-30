/**
 * Hygraph Schema Definition
 * Keep Her Light Alive Foundation — keepherlightalive.com
 *
 * Use this file as the authoritative reference for manual schema creation
 * in the Hygraph UI, or adapt it for the Management API / MCP server.
 *
 * Legend:
 *   [SNG] = Singleton (one entry only, enforced via UI)
 *   [REQ] = Required field (validation: not empty)
 *   [UNQ] = Unique field
 *   [LOC] = Localization-ready (enable localization in Hygraph for future ES support)
 */

const SCHEMA = {
  // ─────────────────────────────────────────────────────────────
  // A. GlobalSiteSettings  [SNG]
  // Purpose: Header/footer text, default SEO, contact details
  // ─────────────────────────────────────────────────────────────
  GlobalSiteSettings: {
    apiId: "GlobalSiteSetting",
    displayName: "Global Site Settings",
    description: "Singleton — controls header, footer, contact info, and default SEO.",
    singleton: true,
    fields: [
      { apiId: "siteName",            type: "String",   label: "Site Name",               required: true,  example: "Keep Her Light Alive Foundation" },
      { apiId: "primaryEmail",        type: "String",   label: "Primary Email",            required: true,  example: "Keepherlightalivesmr@gmail.com" },
      { apiId: "primaryPhone",        type: "String",   label: "Primary Phone",            required: true,  example: "786-874-1881" },
      { apiId: "locationText",        type: "String",   label: "Location (display text)",  required: true,  example: "Florida, United States" },
      { apiId: "donateUrl",           type: "String",   label: "PayPal Donate URL",        required: true,  example: "https://www.paypal.com/donate/?hosted_button_id=FYXLKLEVQ5VYQ" },
      { apiId: "instagramUrl",        type: "String",   label: "Instagram URL",            required: false, example: "https://instagram.com/keepherlightalive" },
      { apiId: "facebookUrl",         type: "String",   label: "Facebook URL",             required: false },
      { apiId: "footerText",          type: "String",   label: "Footer Copyright Text",    required: true,  example: "© 2026 Keep Her Light Alive Foundation. All rights reserved. | Designed by OAC Digital Innovations" },
      { apiId: "seoDefaultTitle",     type: "String",   label: "Default SEO Title",        required: true,  localize: true,  example: "Stephanie Marie Rodriguez Memorial | Keep Her Light Alive Foundation" },
      { apiId: "seoDefaultDescription", type: "String", label: "Default SEO Description", required: true,  localize: true,  example: "Join the Keep Her Light Alive Foundation honoring Stephanie Marie Rodriguez..." },
      { apiId: "ogImage",             type: "Asset",    label: "Default OG Image",         required: false, note: "Upload stephanie-photo.png" },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // B. Page
  // Purpose: Content pages driven by slug — excludes Hero (stays hardcoded)
  // ─────────────────────────────────────────────────────────────
  Page: {
    apiId: "Page",
    displayName: "Page",
    description: "Each slug maps to a route. Sections are flexible content blocks. Hero is NOT managed here.",
    fields: [
      { apiId: "slug",           type: "String",         label: "Slug",            required: true,  unique: true,  example: "mission | stephanies-story | initiatives | events | resources | contact" },
      { apiId: "title",          type: "String",         label: "Page Title",      required: true,  localize: true },
      { apiId: "sections",       type: "Union[Section]", label: "Content Sections",required: false, note: "Ordered list of section components" },
      { apiId: "seoTitle",       type: "String",         label: "SEO Title Override",       required: false, localize: true },
      { apiId: "seoDescription", type: "String",         label: "SEO Description Override", required: false, localize: true },
      { apiId: "ogImage",        type: "Asset",          label: "OG Image Override",        required: false },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // C. Section Components (Hygraph Components / Union)
  // Registered as reusable components; Page.sections is a union of all types
  // ─────────────────────────────────────────────────────────────
  Components: {
    RichTextSection: {
      apiId: "RichTextSection",
      displayName: "Rich Text Section",
      description: "Heading + body copy + optional image and CTA button.",
      fields: [
        { apiId: "heading",   type: "String",    label: "Heading",         required: true,  localize: true },
        { apiId: "body",      type: "RichText",  label: "Body",            required: true,  localize: true },
        { apiId: "image",     type: "Asset",     label: "Image (optional)", required: false },
        { apiId: "ctaLabel",  type: "String",    label: "CTA Button Label", required: false, localize: true },
        { apiId: "ctaUrl",    type: "String",    label: "CTA Button URL",   required: false },
      ],
    },
    CardsSection: {
      apiId: "CardsSection",
      displayName: "Cards Section",
      description: "Grid of cards — used for Initiatives overview.",
      fields: [
        { apiId: "heading",   type: "String",              label: "Section Heading", required: true,  localize: true },
        { apiId: "cards",     type: "Relation[Initiative]", label: "Initiative Cards", required: false, note: "Multi-relation to Initiative model, ordered by sortOrder" },
      ],
    },
    SplitSection: {
      apiId: "SplitSection",
      displayName: "Split (Image + Text) Section",
      description: "Two-column layout: image left or right with body text.",
      fields: [
        { apiId: "heading",      type: "String",   label: "Heading",          required: true,  localize: true },
        { apiId: "body",         type: "RichText", label: "Body",             required: true,  localize: true },
        { apiId: "image",        type: "Asset",    label: "Image",            required: true },
        { apiId: "imagePosition",type: "Enum",     label: "Image Position",   required: true,  values: ["left", "right"], default: "left" },
        { apiId: "ctaLabel",     type: "String",   label: "CTA Label",        required: false, localize: true },
        { apiId: "ctaUrl",       type: "String",   label: "CTA URL",          required: false },
      ],
    },
    QuoteSection: {
      apiId: "QuoteSection",
      displayName: "Quote / Pull Quote",
      description: "A highlighted blockquote.",
      fields: [
        { apiId: "quoteText",        type: "String", label: "Quote Text",        required: true,  localize: true },
        { apiId: "quoteAttribution", type: "String", label: "Attribution (name)", required: false, localize: true },
      ],
    },
    FAQSection: {
      apiId: "FAQSection",
      displayName: "FAQ Accordion Section",
      description: "Embeds FAQ items from the FAQItem model.",
      fields: [
        { apiId: "heading", type: "String",          label: "Section Heading",  required: true,  localize: true },
        { apiId: "faqs",    type: "Relation[FAQItem]", label: "FAQ Items",      required: false, note: "Multi-relation, ordered by FAQItem.sortOrder" },
      ],
    },
    FoundersSection: {
      apiId: "FoundersSection",
      displayName: "Founders / Team Section",
      description: "Displays founder cards pulled from Founder model.",
      fields: [
        { apiId: "heading",  type: "String",           label: "Section Heading", required: true,  localize: true },
        { apiId: "founders", type: "Relation[Founder]", label: "Founders",       required: false, note: "Ordered by Founder.sortOrder" },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────
  // D. Founder
  // ─────────────────────────────────────────────────────────────
  Founder: {
    apiId: "Founder",
    displayName: "Founder",
    fields: [
      { apiId: "name",      type: "String",   label: "Full Name",   required: true  },
      { apiId: "roleTitle", type: "String",   label: "Title / Role", required: true,  example: "Co-Founder" },
      { apiId: "photo",     type: "Asset",    label: "Photo",       required: true,  note: "Square or portrait, min 400x400" },
      { apiId: "bio",       type: "RichText", label: "Bio (optional)", required: false, localize: true },
      { apiId: "sortOrder", type: "Int",      label: "Sort Order",  required: true,  default: 0, note: "Lower = appears first" },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // E. FAQItem
  // ─────────────────────────────────────────────────────────────
  FAQItem: {
    apiId: "FAQItem",
    displayName: "FAQ Item",
    fields: [
      { apiId: "question",  type: "String",   label: "Question",   required: true,  localize: true },
      { apiId: "answer",    type: "RichText", label: "Answer",     required: true,  localize: true },
      { apiId: "sortOrder", type: "Int",      label: "Sort Order", required: true,  default: 0 },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // F. Initiative
  // ─────────────────────────────────────────────────────────────
  Initiative: {
    apiId: "Initiative",
    displayName: "Initiative",
    fields: [
      { apiId: "title",       type: "String",   label: "Title",             required: true,  localize: true, example: "Boating Safety Education" },
      { apiId: "summary",     type: "String",   label: "Short Summary",     required: true,  localize: true, note: "1-2 sentences for cards" },
      { apiId: "body",        type: "RichText", label: "Full Body",         required: false, localize: true },
      { apiId: "coverImage",  type: "Asset",    label: "Cover Image",       required: false },
      { apiId: "ctaLabel",    type: "String",   label: "CTA Button Label",  required: false, localize: true },
      { apiId: "ctaUrl",      type: "String",   label: "CTA URL",           required: false },
      { apiId: "sortOrder",   type: "Int",      label: "Sort Order",        required: true,  default: 0 },
      { apiId: "isFeatured",  type: "Boolean",  label: "Featured?",         required: true,  default: false, note: "Featured initiatives appear first on homepage cards" },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // G. Event
  // ─────────────────────────────────────────────────────────────
  Event: {
    apiId: "Event",
    displayName: "Event",
    fields: [
      { apiId: "title",           type: "String",   label: "Event Title",          required: true,  localize: true },
      { apiId: "status",          type: "Enum",     label: "Status",               required: true,  values: ["planned", "scheduled", "completed", "canceled"], default: "planned" },
      { apiId: "startDateTime",   type: "DateTime", label: "Start Date & Time",    required: true },
      { apiId: "endDateTime",     type: "DateTime", label: "End Date & Time",      required: false },
      { apiId: "timezone",        type: "String",   label: "Timezone",             required: true,  default: "America/New_York" },
      { apiId: "locationName",    type: "String",   label: "Venue Name",           required: true,  example: "Hialeah Community Center" },
      { apiId: "locationAddress", type: "String",   label: "Address",              required: false },
      { apiId: "city",            type: "String",   label: "City",                 required: false },
      { apiId: "registrationUrl", type: "String",   label: "Registration URL",     required: false },
      { apiId: "description",     type: "RichText", label: "Description",          required: false, localize: true },
      { apiId: "coverImage",      type: "Asset",    label: "Cover Image",          required: false },
      { apiId: "isPublic",        type: "Boolean",  label: "Publicly Visible?",    required: true,  default: true },
      { apiId: "sortOrder",       type: "Int",      label: "Sort Order",           required: false, default: 0 },
    ],
    notes: "Query upcoming events with: status_in: [planned, scheduled] AND startDateTime_gte: $now, orderBy: startDateTime_ASC",
  },

  // ─────────────────────────────────────────────────────────────
  // H. Resource
  // ─────────────────────────────────────────────────────────────
  Resource: {
    apiId: "Resource",
    displayName: "Resource",
    fields: [
      { apiId: "title",        type: "String",  label: "Title",              required: true, localize: true },
      { apiId: "type",         type: "Enum",    label: "Type",               required: true, values: ["pdf", "link", "video"] },
      { apiId: "category",     type: "Enum",    label: "Category",           required: true, values: ["checklist", "guidelines", "regulations", "other"] },
      { apiId: "description",  type: "String",  label: "Short Description",  required: false, localize: true },
      { apiId: "file",         type: "Asset",   label: "PDF File",           required: false, note: "Required when type=pdf" },
      { apiId: "url",          type: "String",  label: "External URL",       required: false, note: "Required when type=link or video" },
      { apiId: "sourceLabel",  type: "String",  label: "Source Label",       required: false, example: "Official FWC" },
      { apiId: "sortOrder",    type: "Int",     label: "Sort Order",         required: true,  default: 0 },
      { apiId: "isFeatured",   type: "Boolean", label: "Featured?",          required: true,  default: false },
    ],
    notes: "Validation: if type=pdf then file must be set; if type=link|video then url must be set. Enforce via Hygraph field-level validations or custom API resolver.",
  },

  // ─────────────────────────────────────────────────────────────
  // I. ContactTopic
  // ─────────────────────────────────────────────────────────────
  ContactTopic: {
    apiId: "ContactTopic",
    displayName: "Contact Topic (Form Dropdown)",
    description: "Admin-editable options for the contact form subject dropdown.",
    fields: [
      { apiId: "label",     type: "String", label: "Option Label", required: true,  localize: true, example: "General Inquiry" },
      { apiId: "value",     type: "String", label: "Form Value",   required: true,  unique: true,   example: "general-inquiry", note: "Used as <option value=...>" },
      { apiId: "sortOrder", type: "Int",    label: "Sort Order",   required: true,  default: 0 },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // J. CoinInitiativeSettings  [SNG]
  // ─────────────────────────────────────────────────────────────
  CoinInitiativeSettings: {
    apiId: "CoinInitiativeSetting",
    displayName: "Coin Initiative Settings",
    description: "Singleton — controls the Coin Initiative section content.",
    singleton: true,
    fields: [
      { apiId: "heading",          type: "String",   label: "Section Heading",          required: true,  localize: true, example: "The Coin Initiative" },
      { apiId: "body",             type: "RichText", label: "Body Copy",                required: true,  localize: true },
      { apiId: "qrCodeImage",      type: "Asset",    label: "QR Code Image (coin back)", required: false, note: "coin-back.png" },
      { apiId: "coinFrontImage",   type: "Asset",    label: "Coin Front Image",          required: false, note: "coin-front.png" },
      { apiId: "requestCoinCtaUrl",type: "String",   label: "Request Coin CTA URL",      required: false, example: "#contact-form" },
      { apiId: "donateCtaUrl",     type: "String",   label: "Donate CTA URL",            required: false, example: "https://www.paypal.com/donate/?hosted_button_id=FYXLKLEVQ5VYQ" },
    ],
  },

  // ─────────────────────────────────────────────────────────────
  // K. LegalPage
  // ─────────────────────────────────────────────────────────────
  LegalPage: {
    apiId: "LegalPage",
    displayName: "Legal Page",
    fields: [
      { apiId: "slug",        type: "String",   label: "Slug",         required: true,  unique: true,  example: "privacy-policy | terms-of-use" },
      { apiId: "title",       type: "String",   label: "Page Title",   required: true,  localize: true, example: "Privacy Policy" },
      { apiId: "lastUpdated", type: "Date",     label: "Last Updated", required: true,  example: "2026-02-03" },
      { apiId: "body",        type: "RichText", label: "Body Content", required: true,  localize: true },
    ],
  },
};

module.exports = SCHEMA;
