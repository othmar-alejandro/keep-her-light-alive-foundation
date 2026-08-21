# KHLA Shop — Design Spine (Phase 1)

Working reference for the shop's design system, the purchase-journey components, copy rules, and the product-content contract. Companion to `docs/KHLA-Shop-PRD-v2.md` and the prototype in `shop-prototype/`.

## 1. Tokens (source: the shipped site, `website/index.html:99-125`)

| Token | Value | Tailwind (prototype) | CSS var (Next.js port) | Use |
|---|---|---|---|---|
| Gold | `#D4AF37` | `brand.gold` | `--gold` | CTAs, selected state ring, progress, accents. **Never body text on white** (2.1:1). |
| Gold deep | `#B8962E` | — | `--gold-deep` | The only gold allowed as *text* on white/sand (4.6:1). Low-stock notes, icons. |
| Sand | `#F5F5F0` | `brand.sand` | `--sand` | Section grounds, image wells, story block. |
| Slate | `#F8FAFC` | `brand.slate` | `--slate` | Donation card, disabled pills. |
| Dark | `#111111` | `brand.dark` | `--dark` | Text, cart button, selected tab. |
| Navy | `#0D2E47` | `brand.navy` | `--navy` | Announcement banner, "New" chip. |
| Footer | `#000000` | `bg-black` | — | Matches main site. Muted footer text ≥ `#9CA3AF`. |
| Muted text | `#4B5563` on tinted surfaces, `#6B7280` only on pure white | `text-gray-600/500` | `--ink-2` | axe-verified 4.5:1. |
| Display | Playfair Display 400/500/600 | `font-serif` | — | Product names, page titles, section heads, story head. |
| UI | Inter 300–700 | `font-sans` | — | Everything else. (Detector flags Inter as overused; kept deliberately for continuity with the live site.) |
| Radii | pills `9999px`; cards `1.25rem`; sheets/panels `1.5rem` | | | |
| Shadows | soft `0 18px 50px -20px rgba(13,46,71,.25)`; lift `0 30px 70px -30px rgba(13,46,71,.35)` | | `--shadow-soft/--shadow-lift` | Navy-tinted, never gray. |
| Easing | out `cubic-bezier(.23,1,.32,1)`; drawer `cubic-bezier(.32,.72,0,1)` | | `--ease-out/--ease-drawer` | |
| Durations | press 160ms · pills 200ms · drawer 420ms · reveal 700ms | | | UI < 300ms except drawer/reveal. |
| Section rhythm | `py-20 lg:py-28` (site uses `py-32`) | | | |
| Container | `max-w-[1400px] px-5 lg:px-12` | | | Same as site. |

Browser surfaces themed: selection (gold/white), caret and `accent-color` (gold deep), focus ring (2px gold deep, 3px offset), scrollbar (site's 8px/`#e5e5e5`), tabular numerals on every price.

## 2. Component inventory and Norman scorecard

Scored 0–5 after the Codex cold read and the fix pass. Principles: Aff = affordance, Sig = signifier, Con = constraint, Map = mapping, Fb = feedback, CM = conceptual model.

| Component | File / selector | States | Aff | Sig | Con | Map | Fb | CM | Notes |
|---|---|---|---|---|---|---|---|---|---|
| ProductCard | `shop.js cardHTML` | default · hover lift · New · Only a few left · Sold out (desaturated, still visible) | 5 | 5 | 4 | 5 | 4 | 5 | Whole card is the target; name stacks over price on small screens. |
| SizeSelector (pills) | `product.html #variants` | idle · selected (gold ring) · sold out (dashed, struck, `aria-disabled`, still focusable so it is announced) · low stock note | 5 | 5 | 5 | 5 | 5 | 5 | Physical order XS→3XL. Tapping a sold-out size explains, never silently fails. |
| QtyStepper | `.stepper` | min 1 · max = available (button disables) | 5 | 5 | 5 | 5 | 4 | 5 | |
| PriceBlock + shipping line | `#p-price` + truck line | — | — | 5 | — | 5 | 5 | 5 | Shipping is known before any action (PRD §8.3). |
| Primary CTA | `.cta` | disabled "Choose a size" · enabled "Add to bag — $X" · added (dark, 1.1s) · notify-me (sold-out product) | 5 | 5 | 5 | 5 | 5 | 5 | Sticky mobile bar mirrors it once the static one scrolls off. |
| StoryBlock | `.bg-brand-sand` story | — | — | 5 | — | — | — | 5 | Mission signifier + UBIT evidence. No tragedy detail. |
| Details accordion | `details/summary` | closed · open (+ rotates 45°) | 5 | 5 | — | 5 | 5 | 5 | Includes "Is this tax-deductible?" → No. |
| TrustStrip | founders + 3 lines | — | — | 5 | — | — | — | 4 | EIN is a placeholder — **[DECISION NEEDED D5]**. |
| CartDrawer | `#cart-drawer` | empty · lines · flash on add · capped qty · pickup · donation · reserving · sold-out-removed | 5 | 5 | 5 | 5 | 5 | 5 | Bottom sheet on mobile (swipe-down), right panel on desktop; focus trapped, `Escape`, focus returns to trigger; `body` scroll locked. |
| FreeShippingProgress | `.progress` | progress · unlocked (gold) | — | 5 | — | 5 | 5 | 5 | `transform: scaleX`, never width. |
| Fulfilment toggle | `[data-fulfil]` | ship · pickup (zeroes shipping, hint) | 5 | 5 | 5 | 5 | 5 | 5 | |
| DonationCard | `[data-donate]` | none · $5/$10/$25 · other | 5 | 5 | 5 | 5 | 5 | 5 | Visually separate; labelled tax-deductible; disclosure link to footer text. |
| Checkout handoff | `#checkout-btn` | idle (total + Apple Pay mark) · "Reserving your items…" · line-level sold-out failure | 5 | 5 | 5 | 5 | 5 | 5 | Copy sets the Stripe expectation: "You'll pay securely on Stripe… No account needed." |
| Toast | `#toast` | message · message + Undo | — | 5 | — | — | 5 | — | 5s, `role=status`. |
| Thank-you | `thank-you.html` | paid · pickup variant · with/without donation · sample ribbon (no session) | — | 5 | — | 5 | 5 | 5 | Restates item, cost, when, and the non-deductible line; tax labelled *estimated* in the prototype (Stripe supplies the real figure). |
| LangToggle | `#lang-toggle` | EN ↔ ES | 5 | 5 | — | 5 | 5 | 5 | Re-renders dynamic content (fixes the main site's gap). |
| Banner | `.banner` | — | — | 5 | — | — | — | — | Hygraph `ShopBanner` in production. |

Lowest scores: TrustStrip CM (4, placeholder EIN) and ProductCard Con/Fb (4, card shows low-stock only at product level). Both are content/Phase-2 items, not layout.

## 3. Copy rules and string sheet

Rules (from `docs/SOP.md` sensitive-content section + PRD §19):
1. Lead with life. One sentence max about the accident anywhere on the shop; none on product pages.
2. No guilt, no fake urgency. "Only N left" only when `available_qty ≤ 3`.
3. Never imply merchandise is tax-deductible. Donations are, and are receipted separately with the EIN.
4. Controls name their action ("Add to bag — $28", "Checkout · $33"). Errors name the recovery ("Large sold out while you were shopping — removed").
5. Krug pass: every page's copy was cut at least in half from the first draft; PDP body copy lives in accordions.

The full EN/ES sheet is `shop-prototype/shared/shop.js` (`STR`), ~110 keys. **Spanish is a reviewed draft, not a deliverable** — a native Cuban-American founder reviews every string before launch (PRD §10.3, launch blocker). Changes already made from the Codex pass: "Información útil", "huella digital", "se emite un comprobante por separado", loss framing removed from `home.why.p`.

## 4. Product-content contract (gate before a product goes live)

| Item | Requirement | Owner | PRD ref |
|---|---|---|---|
| Photos | ≥3 per product: front flat-lay, back, worn by a real community member. Square, ≥1200×1200, <300KB, same crop and warm light across the catalog. Alt text authored in Hygraph. | Founders + photographer | §18 |
| Coin photos | Existing `coin-front/back-final.png` have a baked-in checkerboard; the shop masks them to a circle. Re-export with true transparency before launch. | Developer | — |
| Size chart | Garment measurements in inches **and** centimeters; model height + size worn. | Supplier + founders | §18 |
| Fabric, fit, care | One line each. | Founders | §18 |
| Story paragraph | 2–3 sentences, why this design exists, tied to the mission. Required. | Founders | §18, §20.3 |
| SKU / variants / price | `KHLA-<TYPE>-<COLOR>-<SIZE>`, price in cents. | Founders | §18, §7.1 |
| Shipping | Flat rate, free threshold, pickup address + hours, processing window. Prototype assumes $5 / free over $50 / 3–5 business days / Miami pickup. | Founders | **D2, D8** |
| Returns | Window, who pays return postage, coins final sale? Prototype assumes 30-day unworn exchange, coins final. | Founders | **D3** |
| Legal | EIN, 501(c)(3) determination, FDACS CH# and current disclosure text. | Founders + counsel | **D5**, §20.4 |
| Impact numbers | Real figures for coins shared / events / people reached (prototype values are illustrative and labelled). | Founders | — |

## 5. Trust modules (a store with no reviews)

Founders' faces + "run by Stephanie's family and friends" · 501(c)(3) + EIN · "Secure checkout by Stripe · Apple Pay · Google Pay · Link" · honest shipping window and cost before the CTA · returns answer in the accordion · free local pickup · "Where does the money go?" FAQ · the non-deductible line on the receipt (honesty is the trust signal) · Instagram DM as the support path.

## 6. Verification log (2026-08-21)

- Rendered in the in-app browser and Playwright at 375×812 and 1280×800; full-page captures in `shop-prototype/screenshots/` (home, PDP low-stock, drawer, bag, thank-you ES, desktop PDP + home).
- Keyboard: header cart button → drawer opens, focus moves to Close, `Tab` cycles inside, `Escape` closes and returns focus to the trigger (verified by script). Size-guide sheet has the same trap.
- axe (wcag2a/aa/21aa) on PDP and thank-you: only contrast findings, all fixed (gray-500 on sand → gray-600; footer gray-600 → gray-400). Re-run before Phase 2.
- Impeccable detector: Inter warning (deliberate), `transition: width` on progress (fixed → `scaleX`).
- Codex cold-read challenge applied: stale-bag reconcile on load, capped-add feedback, sample-order ribbon + estimated tax label, live disclosure anchor, size-sheet focus trap, copy fixes.
- Audit pass (same day): zero console errors on all four pages (only the Tailwind-CDN dev notice remains); no horizontal overflow at 375/1280; no broken images; `website/` untouched (the only tracked diff, `cms.js`, predates this work). Images now served from `shop-prototype/assets/` (4.9 MB → 1.2 MB). Lucide's removed `instagram` icon replaced with inline SVG; favicon added; dead code and unused exports trimmed.
- Not verified here: real iPhone Apple Pay (Track D), Spanish native review, real photography.

## 7. Figma handoff

Planned: push tokens, components, and the four screens at 375/1280 into a KHLA Shop Figma file via the Figma MCP (`generate_figma_design`). Prerequisite: Dev Mode MCP Server enabled in Figma desktop, or a file key the connector can write to.
