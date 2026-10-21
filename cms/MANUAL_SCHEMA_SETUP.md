# Manual Schema Setup in Hygraph UI

Go to: https://app.hygraph.com → your project → **Schema** tab.

This takes about 20–30 minutes. Once done, tell Claude and the seed script will auto-populate all content.

---

## Step 0 — Create Enumerations first

Go to **Schema → Enumerations → + Add Enumeration**

### EventStatus
- API ID: `EventStatus`
- Values (add each): `planned`, `scheduled`, `completed`, `canceled`

### ResourceType
- API ID: `ResourceType`
- Values: `pdf`, `link`, `video`

### ResourceCategory
- API ID: `ResourceCategory`
- Values: `checklist`, `guidelines`, `regulations`, `other`

### ImagePosition
- API ID: `ImagePosition`
- Values: `left`, `right`

---

## Step 1 — FAQItem model

**Schema → + Add Model**
- Display Name: `FAQ Item`
- API ID: `FAQItem`
- API ID Plural: `FAQItems`

Add these fields (click **+ Add Field** inside the model):

| Field | Type | API ID | Required? |
|-------|------|--------|-----------|
| Question | Single line text | `question` | ✅ |
| Answer | Rich text | `answer` | ✅ |
| Sort Order | Integer | `sortOrder` | ✅ |

---

## Step 2 — Founder model

- Display Name: `Founder`
- API ID: `Founder`
- API ID Plural: `Founders`

| Field | Type | API ID | Required? |
|-------|------|--------|-----------|
| Full Name | Single line text | `name` | ✅ |
| Role / Title | Single line text | `roleTitle` | ✅ |
| Photo | Asset | `photo` | ❌ |
| Bio | Rich text | `bio` | ❌ |
| Sort Order | Integer | `sortOrder` | ✅ |

---

## Step 3 — Initiative model

- Display Name: `Initiative`
- API ID: `Initiative`
- API ID Plural: `Initiatives`

| Field | Type | API ID | Required? |
|-------|------|--------|-----------|
| Title | Single line text | `title` | ✅ |
| Short Summary | Single line text | `summary` | ✅ |
| Body | Rich text | `body` | ❌ |
| Cover Image | Asset | `coverImage` | ❌ |
| CTA Button Label | Single line text | `ctaLabel` | ❌ |
| CTA URL | Single line text | `ctaUrl` | ❌ |
| Sort Order | Integer | `sortOrder` | ✅ |
| Featured? | Boolean | `isFeatured` | ❌ |

---

## Step 4 — Event model

- Display Name: `Event`
- API ID: `Event`
- API ID Plural: `Events`

| Field | Type | API ID | Required? |
|-------|------|--------|-----------|
| Title | Single line text | `title` | ✅ |
| Status | Enumeration → EventStatus | `status` | ✅ |
| Start Date and Time | Date & Time | `startDateTime` | ✅ |
| End Date and Time | Date & Time | `endDateTime` | ❌ |
| Timezone | Single line text | `timezone` | ❌ |
| Venue Name | Single line text | `locationName` | ✅ |
| Address | Single line text | `locationAddress` | ❌ |
| City | Single line text | `city` | ❌ |
| Registration URL | Single line text | `registrationUrl` | ❌ |
| Description | Rich text | `description` | ❌ |
| Cover Image | Asset | `coverImage` | ❌ |
| Publicly Visible | Boolean | `isPublic` | ❌ |
| Sort Order | Integer | `sortOrder` | ❌ |

---

## Step 5 — Resource model

- Display Name: `Resource`
- API ID: `Resource`
- API ID Plural: `Resources`

| Field | Type | API ID | Required? |
|-------|------|--------|-----------|
| Title | Single line text | `title` | ✅ |
| Type | Enumeration → ResourceType | `type` | ✅ |
| Category | Enumeration → ResourceCategory | `category` | ✅ |
| Short Description | Single line text | `description` | ❌ |
| PDF File | Asset | `file` | ❌ |
| External URL | Single line text | `url` | ❌ |
| Source Label | Single line text | `sourceLabel` | ❌ |
| Sort Order | Integer | `sortOrder` | ✅ |
| Featured | Boolean | `isFeatured` | ❌ |

---

## Step 6 — ContactTopic model

- Display Name: `Contact Topic`
- API ID: `ContactTopic`
- API ID Plural: `ContactTopics`

| Field | Type | API ID | Required? | Unique? |
|-------|------|--------|-----------|---------|
| Option Label | Single line text | `label` | ✅ | ❌ |
| Form Value | Single line text | `value` | ✅ | ✅ |
| Sort Order | Integer | `sortOrder` | ✅ | ❌ |

---

## Step 7 — GlobalSiteSetting model

- Display Name: `Global Site Settings`
- API ID: `GlobalSiteSetting`
- API ID Plural: `GlobalSiteSettings`

| Field | Type | API ID | Required? |
|-------|------|--------|-----------|
| Site Name | Single line text | `siteName` | ✅ |
| Primary Email | Single line text | `primaryEmail` | ✅ |
| Primary Phone | Single line text | `primaryPhone` | ✅ |
| Location Text | Single line text | `locationText` | ✅ |
| PayPal Donate URL | Single line text | `donateUrl` | ✅ |
| Instagram URL | Single line text | `instagramUrl` | ❌ |
| Facebook URL | Single line text | `facebookUrl` | ❌ |
| Footer Copyright Text | Single line text | `footerText` | ✅ |
| Default SEO Title | Single line text | `seoDefaultTitle` | ✅ |
| Default SEO Description | Single line text | `seoDefaultDescription` | ✅ |
| Default OG Image | Asset | `ogImage` | ❌ |

---

## Step 8 — CoinInitiativeSetting model

- Display Name: `Coin Initiative Settings`
- API ID: `CoinInitiativeSetting`
- API ID Plural: `CoinInitiativeSettings`

| Field | Type | API ID | Required? |
|-------|------|--------|-----------|
| Section Heading | Single line text | `heading` | ✅ |
| Body Copy | Rich text | `body` | ✅ |
| QR Code Image | Asset | `qrCodeImage` | ❌ |
| Coin Front Image | Asset | `coinFrontImage` | ❌ |
| Request Coin CTA URL | Single line text | `requestCoinCtaUrl` | ❌ |
| Donate CTA URL | Single line text | `donateCtaUrl` | ❌ |

---

## Step 9 — LegalPage model

- Display Name: `Legal Page`
- API ID: `LegalPage`
- API ID Plural: `LegalPages`

| Field | Type | API ID | Required? | Unique? |
|-------|------|--------|-----------|---------|
| Slug | Single line text | `slug` | ✅ | ✅ |
| Page Title | Single line text | `title` | ✅ | ❌ |
| Last Updated | Date | `lastUpdated` | ✅ | ❌ |
| Body Content | Rich text | `body` | ✅ | ❌ |

---

## Step 10 — Section Components

Go to **Schema → + Add Component** for each of these:

### RichTextSection
- API ID: `RichTextSection` / Plural: `RichTextSections`

| Field | Type | API ID | Required? |
|-------|------|--------|-----------|
| Heading | Single line text | `heading` | ✅ |
| Body | Rich text | `body` | ✅ |
| Image | Asset | `image` | ❌ |
| CTA Button Label | Single line text | `ctaLabel` | ❌ |
| CTA Button URL | Single line text | `ctaUrl` | ❌ |

### CardsSection
- API ID: `CardsSection` / Plural: `CardsSections`

| Field | Type | API ID | Required? |
|-------|------|--------|-----------|
| Section Heading | Single line text | `heading` | ✅ |
| Initiative Cards | Reference → Initiative (allow multiple) | `cards` | ❌ |

### SplitSection
- API ID: `SplitSection` / Plural: `SplitSections`

| Field | Type | API ID | Required? |
|-------|------|--------|-----------|
| Heading | Single line text | `heading` | ✅ |
| Body | Rich text | `body` | ✅ |
| Image | Asset | `image` | ❌ |
| Image Position | Enumeration → ImagePosition | `imagePosition` | ❌ |
| CTA Label | Single line text | `ctaLabel` | ❌ |
| CTA URL | Single line text | `ctaUrl` | ❌ |

### QuoteSection
- API ID: `QuoteSection` / Plural: `QuoteSections`

| Field | Type | API ID | Required? |
|-------|------|--------|-----------|
| Quote Text | Single line text | `quoteText` | ✅ |
| Attribution | Single line text | `quoteAttribution` | ❌ |

### FAQSection
- API ID: `FAQSection` / Plural: `FAQSections`

| Field | Type | API ID | Required? |
|-------|------|--------|-----------|
| Section Heading | Single line text | `heading` | ✅ |
| FAQ Items | Reference → FAQItem (allow multiple) | `faqs` | ❌ |

### FoundersSection
- API ID: `FoundersSection` / Plural: `FoundersSections`

| Field | Type | API ID | Required? |
|-------|------|--------|-----------|
| Section Heading | Single line text | `heading` | ✅ |
| Founders | Reference → Founder (allow multiple) | `founders` | ❌ |

---

## Step 11 — Page model

- Display Name: `Page`
- API ID: `Page`
- API ID Plural: `Pages`

| Field | Type | API ID | Required? | Unique? |
|-------|------|--------|-----------|---------|
| Slug | Single line text | `slug` | ✅ | ✅ |
| Page Title | Single line text | `title` | ✅ | ❌ |
| Content Sections | Component (allow multiple — select ALL 6 components) | `sections` | ❌ | ❌ |
| SEO Title Override | Single line text | `seoTitle` | ❌ | ❌ |
| SEO Description Override | Single line text | `seoDescription` | ❌ | ❌ |
| OG Image Override | Asset | `ogImage` | ❌ | ❌ |

For **Content Sections**: choose field type **"Component"**, enable **"Allow multiple values"**, and in the component picker select all 6: RichTextSection, CardsSection, SplitSection, QuoteSection, FAQSection, FoundersSection.

---

## ✅ When you're done

Come back and tell me "schema is done" — I'll immediately run the seed script to populate:
- GlobalSiteSettings (email, phone, footer, donate URL)
- CoinInitiativeSettings (heading, body copy, CTAs)
- 3 Founders (Magaly, Midalys, Natalie)
- 6 FAQs
- 3 Resources
- 5 Contact Topics
- 4 Initiatives
- 2 Legal Pages (privacy policy, terms of use)
