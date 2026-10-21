# Hygraph CMS — Keep Her Light Alive Foundation

Complete implementation guide for integrating Hygraph headless CMS with keepherlightalive.com.

---

## Part 1 — Hygraph Project Setup

### 1.1 Create Project
1. Log in at [app.hygraph.com](https://app.hygraph.com)
2. Create a new project → name: **Keep Her Light Alive**
3. Region: **US West 2** (already set — your endpoint confirms it)
4. Your endpoint: `https://api-us-west-2.hygraph.com/v2/cmm1zo3c701dl07wctz81kt8e/master`

### 1.2 Stages
In **Project Settings → Stages**, confirm these two exist (they're defaults):
- **Draft** — working state for editors
- **Published** — live state that the frontend reads

### 1.3 Roles & Permissions

| Role | Access |
|------|--------|
| **Admin** | Full access: models, entries, assets, publishing, settings |
| **Editor** | Create/edit/publish entries + upload assets; no schema editing |
| **Viewer** (optional) | Read-only — use for external reviewers |

Set up in **Project Settings → Roles → Create Role**.

Assign permissions per role:
- Editor: `Content → Create`, `Content → Update`, `Content → Publish`, `Assets → Create`
- Viewer: `Content → Read` (stage: PUBLISHED only)

### 1.4 Webhooks (Publish Trigger)
In **Project Settings → Webhooks → Create**:
- Name: **Vercel Rebuild on Publish**
- Trigger: `Content Model → Published`
- URL: `https://api.vercel.com/v1/integrations/deploy/<YOUR_DEPLOY_HOOK_ID>` (get from Vercel → Project → Settings → Git → Deploy Hooks → Create Hook)
- Method: `POST`

This triggers a site rebuild every time an editor publishes content.

### 1.5 Environment Variables

```env
# .env (already saved at project root)
HYGRAPH_ENDPOINT=https://api-us-west-2.hygraph.com/v2/cmm1zo3c701dl07wctz81kt8e/master
HYGRAPH_MANAGEMENT_TOKEN=<your permanent auth token — saved in .env>
HYGRAPH_TOKEN=<create a READ-ONLY permanent auth token in Hygraph → used in frontend>
HYGRAPH_STAGE=PUBLISHED
```

**Create a separate read-only token** for the frontend:
- Hygraph → Project Settings → API Access → Permanent Auth Tokens → Add
- Permissions: Content → Read (PUBLISHED stage only)
- Copy the token into `HYGRAPH_TOKEN` in `.env`

---

## Part 2 — MCP Server Setup

Located at `cms/mcp-server/`.

### Install & Run
```bash
cd cms/mcp-server
npm install
node src/index.js          # live mode
DRY_RUN=true node src/index.js  # dry-run mode (no writes)
```

### Claude Desktop Integration
Add to `~/.claude/claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "hygraph": {
      "command": "node",
      "args": ["/Users/othmarcasilla/Keep Her Light Alive - Foundation/cms/mcp-server/src/index.js"],
      "env": {
        "HYGRAPH_ENDPOINT": "https://api-us-west-2.hygraph.com/v2/cmm1zo3c701dl07wctz81kt8e/master",
        "HYGRAPH_MANAGEMENT_TOKEN": "<token from .env>"
      }
    }
  }
}
```

### Available MCP Tools

| Tool | Description |
|------|-------------|
| `createEntry` | Create content entry (`modelApiId` + `data` object) |
| `publishEntry` | Publish entry to PUBLISHED stage |
| `updateEntry` | Update fields on existing entry |
| `uploadAsset` | Upload image/PDF by URL |
| `linkAsset` | Connect an uploaded asset to an entry field |

**Dry-run safety**: Set `DRY_RUN=true` to log all operations without executing. Always test in dry-run first.

---

## Part 3 — Schema (field-by-field)

See `schema/hygraph-schema.js` for the complete machine-readable definition.

### Create models in this order (respect dependencies):
1. `FAQItem` — standalone
2. `Founder` — standalone
3. `Initiative` — standalone
4. `Event` — standalone
5. `Resource` — standalone
6. `ContactTopic` — standalone
7. `GlobalSiteSettings` — singleton, uses Asset
8. `CoinInitiativeSettings` — singleton, uses Asset
9. `LegalPage` — standalone
10. `Page` + Section components — references FAQItem, Founder, Initiative

### Section Components Union
In Hygraph UI → Schema → Components, create these components:
- `RichTextSection`
- `CardsSection`
- `SplitSection`
- `QuoteSection`
- `FAQSection`
- `FoundersSection`

Then on the `Page` model, add a field `sections` of type **"Component (allow multiple)"** and allow all 6 component types. This creates the union.

### Key Validation Rules to Set in Hygraph UI
- `Page.slug` → Unique, required
- `LegalPage.slug` → Unique, required
- `ContactTopic.value` → Unique, required
- `Resource` → Add a custom note in field description: "If type=pdf, file is required. If type=link or video, url is required."
- `Founder.photo` → Required

---

## Part 4 — Migration / Seed

Run the seed script **after all models are created**:

```bash
cd cms/seed
node -e "require('dotenv').config({path:'../../.env'})" && node seed.js

# Or with env vars inline:
HYGRAPH_ENDPOINT=... HYGRAPH_MANAGEMENT_TOKEN=... node seed.js

# Dry run first:
DRY_RUN=true node seed.js
```

### Seed covers:
- [x] GlobalSiteSettings (contact info, SEO, footer)
- [x] CoinInitiativeSettings (body copy, CTA URLs)
- [x] 3 Founders (Magaly, Midalys, Natalie) — photos need manual upload
- [x] 6 FAQ items
- [x] 3 Resources (FWC checklist, Coast Guard, FL regulations)
- [x] 5 Contact Topics
- [x] 4 Initiatives
- [x] 2 Legal Pages (privacy-policy, terms-of-use) — paste full body before production run

### After seed — manual steps:
1. **Upload founder photos** in Hygraph UI → Assets:
   - `resources/founder-magaly-pro.png`
   - `resources/founder-midalys-pro-1.png`
   - `resources/founder-natalie-pro.png`
2. **Link photos** to each Founder entry in the UI
3. **Upload coin images**: `coin-front.png`, `coin-back.png` → link to CoinInitiativeSettings
4. **Create Pages** in Hygraph UI with the following slugs and sections:

| Slug | Sections |
|------|---------|
| `mission` | RichTextSection (mission quote + pillars) |
| `stephanies-story` | SplitSection (photo + story text) + QuoteSection |
| `initiatives` | CardsSection (link to Initiative entries) |
| `events` | (dynamic — queries Event model directly) |
| `resources` | (dynamic — queries Resource model directly) |
| `contact` | RichTextSection (contact details) |

---

## Part 5 — Frontend Integration

### Queries
See `queries/hygraph-queries.js` for all GraphQL queries:
- `GLOBAL_SETTINGS_QUERY` — header/footer/SEO
- `PAGE_BY_SLUG_QUERY` — page + sections
- `EVENTS_QUERY` — upcoming events (pass `$now`)
- `RESOURCES_QUERY` — all resources
- `LEGAL_PAGE_QUERY` — privacy-policy / terms-of-use
- `CONTACT_TOPICS_QUERY` — form dropdown options
- `COIN_SETTINGS_QUERY` — coin initiative section

### Build-time fetch (recommended for static site)
```js
// In a Node.js build script (build.js):
const { GLOBAL_SETTINGS_QUERY, EVENTS_QUERY } = require('./cms/queries/hygraph-queries');

async function buildData() {
  const settings = await hygraphFetch(GLOBAL_SETTINGS_QUERY);
  const events   = await hygraphFetch(EVENTS_QUERY, { now: new Date().toISOString() });
  // Write to /website/data/cms.json
  // Then inject into HTML templates via template literals or DOM manipulation
}
```

### Caching strategy
- **Build-time**: Fetch all data at build → no runtime latency, automatic on webhook trigger
- **Runtime (optional)**: Cache responses for 10 minutes using `Cache-Control: max-age=600`
- **Invalidation**: Netlify webhook fires on Hygraph publish → triggers rebuild → fresh data

### Section rendering dispatch (add to translations.js or a new `cms-renderer.js`):
```js
function renderSection(section, container) {
  switch (section.__typename) {
    case 'RichTextSection':   return renderRichText(section, container);
    case 'CardsSection':      return renderCards(section, container);
    case 'SplitSection':      return renderSplit(section, container);
    case 'QuoteSection':      return renderQuote(section, container);
    case 'FAQSection':        return renderFAQ(section, container);
    case 'FoundersSection':   return renderFounders(section, container);
    default: console.warn('Unknown section:', section.__typename);
  }
}

// Safe rich text injection (always sanitize Hygraph HTML):
function safeHTML(html) {
  // Browser: use DOMPurify.sanitize(html)
  // Build-time Node: use isomorphic-dompurify or sanitize-html
  return html; // replace with actual sanitizer
}
```

### Hero stays hardcoded
The hero section in `website/index.html` is intentionally **not** connected to Hygraph.
Do not add a hero field to any Hygraph model.

### Events — Coming Soon fallback
```js
async function renderEventsSection() {
  const { events } = await hygraphFetch(EVENTS_QUERY, { now: new Date().toISOString() });
  if (!events || events.length === 0) {
    // Show the hardcoded "Calendar Coming Soon" block (already in index.html)
    document.getElementById('events-coming-soon').classList.remove('hidden');
  } else {
    // Render event cards dynamically
    renderEventCards(events);
  }
}
```

---

## Part 6 — Acceptance Criteria

| Requirement | Status |
|-------------|--------|
| Admin can update all page content except hero | ✅ All pages managed via Page model; hero is hardcoded |
| Founders editable | ✅ Founder model |
| FAQs editable | ✅ FAQItem model |
| Initiatives editable | ✅ Initiative model |
| Events calendar (planned/scheduled/completed/canceled) | ✅ Event model with status enum |
| Events "coming soon" when empty | ✅ Empty array → render coming-soon block |
| Resources: downloads + external links | ✅ Resource.type: pdf/link/video; Resource.file + Resource.url |
| Contact dropdown topics editable | ✅ ContactTopic model |
| Footer contact info editable | ✅ GlobalSiteSettings |
| Legal pages (privacy, terms) editable | ✅ LegalPage model |
| Draft/Published workflow | ✅ Hygraph default stages |
| Defensive rendering for optional fields | ✅ Use optional chaining in render functions |
| Hero stays hardcoded | ✅ No hero model; explicitly excluded |
| Bilingual-ready | ✅ localize: true on all user-facing text fields |
| Webhook on publish | ✅ Configure in Project Settings → Webhooks |
