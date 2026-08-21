# PRODUCT.md — Keep Her Light Alive Foundation

**What it is.** The website and (new) online shop of Keep Her Light Alive Foundation, Inc., a Florida 501(c)(3) founded in 2026 by four women in memory of Stephanie Marie Rodriguez (Hialeah, FL; 1996–2024). The Foundation teaches boating and water safety in South Florida's largely Cuban-American community and runs a memorial coin initiative.

**Who uses it.**
- *Maria*, supporter, mid-30s, Miami-Dade, iPhone Safari at night, came from Instagram, Apple Pay ready, may switch to Spanish. Buys a tee or coin; never creates an account.
- *Magaly*, founder/operator, non-technical, authors products in Hygraph, packs orders.
- *Event volunteer*, takes merchandise to walks and galas.

**What success looks like.** Maria goes from a product link to a paid Apple Pay order in under 60 seconds, always knowing the shipping cost before she pays, and leaves feeling she has met Stephanie's light — not her death. Magaly never has to call the developer.

**Voice.** Warm, hopeful, plain. Lead with life, never tragedy detail. No guilt, no fake urgency, never imply merchandise is tax-deductible (separate donations are). Bilingual EN/ES with equal care; Spanish must read native to a Cuban-American reader.

**Surfaces.** Main site (static, live): home, story, mission, events, resources, contact. Shop (this phase): catalog, product page, bag, Stripe hosted checkout, thank-you, track. Admin console comes later.

**Constraints.** Existing visual system is the incumbent authority (see the design spine in the private docs folder): Playfair Display + Inter, gold `#D4AF37`, sand `#F5F5F0`, dark `#111111`, navy `#0D2E47`, black footer, gold pill buttons, 12–24px radii. WCAG 2.1 AA. Mobile first (375px). Payment UI never lives on our domain (Stripe Checkout). Hygraph free tier; Supabase; Vercel.

**Source of truth.** The live `website/` code (visual tokens), plus internal docs kept **outside this public repo** at `~/KHLA-private-docs/`: `KHLA-Shop-PRD-v2.md` (requirements), `shop-design-spine.md` (tokens, component scorecard, content contract), `SOP.md` (tone and sensitive-content rules).
