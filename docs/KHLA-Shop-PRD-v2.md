# Product Requirements Document — Keep Her Light Alive Foundation Shop

**Product:** A custom-built e-commerce store for keepherlightalive.com
**Owner:** OAC Digital Innovations
**Client:** Keep Her Light Alive Foundation, Inc.
**Version:** 2.0 — custom build (supersedes v1, which recommended Shopify)
**Date:** August 21, 2026
**Status:** Draft for approval

---

## 0. Read this first — three things that decide the project

**1. Products are authored in Hygraph and pushed to Stripe automatically.** A founder creates a product in Hygraph, sets the price, hits Publish. A webhook fires, creates or updates the matching Stripe Product and Price, and writes the variant into Supabase. Nobody logs into Stripe to sell something. This is the core mechanism of the whole build and §7 specifies it exactly.

**2. "No monthly fees" is not fully achievable, and the reason is Vercel, not the store.** Vercel's Fair Use Guidelines state that Hobby teams are "restricted to non-commercial personal use only," that commercial usage includes "any method of requesting or processing payment from visitors of the site," and — explicitly — **"Asking for Donations fall under commercial usage."** A store puts the site in Pro territory at **$20/month**. Worth knowing: the existing PayPal donate button already does, so this is a pre-existing exposure the shop merely makes obvious. §22 gives the honest number: **$20/month floor, $45/month recommended.**

**3. This will not be cheaper than Shopify.** At 50 orders a month the custom build runs about **$121/month** against Shopify Basic's **$105**, plus 5–7 weeks of development. It can be brought to roughly $76 by giving up database backups and open-sourcing the storefront. The case for building is ownership, no platform risk, and the Hygraph-to-processor workflow the client actually wants — **not** the monthly bill. §22.5 lays this out in full so nobody tells the board it saves money.

**4. Stripe's nonprofit discount almost certainly does not apply here.** Stripe's own support article requires that **at least 80% of payment volume come from tax-deductible donations**, and explicitly excludes merchandise-style sales. Budget the standard 2.9% + $0.30. Do not build a plan around 2.2%.

Everything marked **[DECISION NEEDED]** needs a founder answer. Everything marked **[VERIFY]** must be tested against a live account before it is relied on.

---

## 1. Summary

The Foundation gets a store at `keepherlightalive.com/shop`, built and owned outright — no Shopify, no commerce SaaS subscription, no per-order platform cut beyond payment processing.

**The stack:**

| Layer | Choice | Why |
|---|---|---|
| Product authoring | **Hygraph** (already in use, free tier) | Founders already work here. Webhooks are available on the free plan. |
| Transactional backend | **Supabase** Postgres | Inventory, orders, customers, promo redemptions, auth. Atomic stock operations. |
| Payments | **Stripe Checkout** (hosted) | Apple Pay with no Apple Developer account. PCI stays at SAQ A. Promo codes and tax built in. No monthly fee. |
| Storefront | **Next.js app on Vercel**, separate project | Never touches the existing static site. Routed at `/shop`. |
| Shipping labels | **Pirate Ship** | Genuinely free, no per-label fee, USPS Commercial rates, CSV import. |
| Transactional email | **Resend** | Free at this volume, custom sending domain. |

**The existing site does not change.** `index.html`, `translations.js`, `cms.js` are untouched. The shop is a separate Vercel project reached through one rewrite rule, plus a nav link and an announcement block on the home page.

Build estimate: **5–7 weeks** for the full scope, across four phases.

---

## 2. Goals and non-goals

### 2.1 Goals

| # | Goal |
|---|---|
| G1 | Sell apparel and memorial merchandise from the Foundation's own domain, in the Foundation's own brand. |
| G2 | A founder adds a product in Hygraph, sets a price, publishes — and it is live and purchasable within a minute, with no developer involved. |
| G3 | Apple Pay, Google Pay, Link, and cards at checkout. |
| G4 | Inventory that cannot oversell, including under concurrent checkouts. |
| G5 | Orders, fulfillment, and shipping labels operable by a non-technical volunteer. |
| G6 | Promo codes with per-code redemption tracking. |
| G7 | Optional customer accounts with order history — never required to buy. |
| G8 | An optional donation add-on at checkout, receipted correctly and separately from merchandise. |
| G9 | Bilingual EN/ES, including the checkout. |
| G10 | Compliant: Florida sales tax, FTC shipping rules, correct receipting, WCAG 2.1 AA. |
| G11 | Zero regression on the existing site. |

### 2.2 Non-goals

- Modifying the existing static site beyond a nav link, an announcement block, and one rewrite rule.
- Print-on-demand. The Foundation buys inventory and ships it.
- Subscriptions, gift cards, loyalty programs, wholesale.
- Replacing the PayPal donate button — it stays.
- International shipping in v1.
- A native mobile app.
- Building our own payment form. Card fields never touch our domain (§20.8).

### 2.3 Success metrics at 90 days

| Metric | Target |
|---|---|
| Orders per month | 40+ |
| Checkout completion (reached Stripe → paid) | ≥ 55% |
| Share paid by wallet (Apple Pay / Google Pay / Link) | ≥ 35% |
| Mobile share of orders | ≥ 60% |
| Median order → shipped | ≤ 3 business days |
| Oversell incidents | **0** |
| Inventory accuracy at monthly count | ≥ 98% |
| Developer support requests per month after month 1 | ≤ 2 |
| Orders including a donation add-on | ≥ 15% |

The last two matter most. A store that needs its developer weekly has failed regardless of revenue.

---

## 3. Users

**Maria — the supporter.** Mid-30s, Miami-Dade, found the Foundation on Instagram or at a memorial walk. iPhone, Safari, usually at night, Apple Pay set up. Will not create an account to buy a shirt. May switch the site to Spanish. Needs: see it, pick a size, know shipping before committing, pay with a thumbprint, get a confirmation.

**Magaly — the store operator.** A founder. Not technical. Already fluent in Hygraph. Adds products in Hygraph. Checks orders and packs boxes a few times a week. Needs: obvious buttons, one place for orders, a warning before something sells out.

**The event volunteer.** Works a table at a walk or gala. Needs to take a card payment on a phone without the website overselling what is physically in the car.

**The developer.** Builds it, then steps back. Needs an architecture that is boring, documented, and recoverable by someone else.

---

## 4. Architecture

### 4.1 The whole system

```
┌───────────────────────────────────────────────────────────────────┐
│  EXISTING SITE — keepherlightalive.com  (static, UNTOUCHED)       │
│  index.html · translations.js · cms.js · Hygraph editorial        │
│                                                                   │
│  + nav link "Shop"      + announcement block on home              │
│  + vercel.json rewrite:  /shop/:path*  →  shop project            │
└──────────────────────────────┬────────────────────────────────────┘
                               │
┌──────────────────────────────▼────────────────────────────────────┐
│  SHOP APP — Next.js, separate Vercel project                      │
│                                                                   │
│  /shop            catalog          /shop/admin   operator console │
│  /shop/p/[slug]   product          /shop/account customer orders  │
│  /shop/cart       cart                                            │
│                                                                   │
│  API routes:                                                      │
│   POST /api/checkout          create Stripe session + reserve stock│
│   POST /api/webhooks/stripe   completed · expired · refunded       │
│   POST /api/webhooks/hygraph  publish → sync Stripe + Supabase     │
│   POST /api/admin/*           orders, stock, fulfillment           │
│   GET  /api/cron/sweep        release stale reservations           │
└───┬───────────────────┬──────────────────────┬────────────────────┘
    │                   │                      │
    ▼                   ▼                      ▼
┌─────────────┐  ┌──────────────────┐  ┌──────────────────────────┐
│  HYGRAPH    │  │    SUPABASE      │  │        STRIPE            │
│  (free)     │  │   Postgres       │  │                          │
│             │  │                  │  │  Products + Prices       │
│ ShopProduct │  │ products         │  │   (mirrored from Hygraph)│
│ ShopVariant │  │ variants + stock │  │  Checkout Sessions       │
│ ShopPage    │  │ reservations     │  │  Coupons/Promo codes     │
│ ShopFaq     │  │ orders           │  │  Stripe Tax              │
│ ShopPolicy  │  │ order_items      │  │  Apple Pay · Google Pay  │
│             │  │ customers        │  │  Link · cards            │
│ AUTHORING   │  │ promo_redemptions│  │                          │
│ + PRICES    │  │ inventory_ledger │  │  PAYMENT + CATALOG MIRROR│
│             │  │ webhook_events   │  │                          │
│             │  │ TRUTH: STOCK,    │  │                          │
│             │  │ ORDERS, CUSTOMERS│  │                          │
└─────────────┘  └──────────────────┘  └──────────────────────────┘
        ▲                                          │
        │ publish                                  │ paid
   ┌────┴─────┐                            ┌───────▼────────┐
   │ MAGALY   │                            │ Resend emails  │
   │ (Hygraph)│                            │ Pirate Ship CSV│
   └──────────┘                            └────────────────┘
```

### 4.2 Where each fact lives — one home, no exceptions

| Fact | Source of truth | Mirrored to | Edited in |
|---|---|---|---|
| Product title, description, story, images, size chart | **Hygraph** | Supabase (cache), Stripe (name/images) | Hygraph |
| Price | **Hygraph** | Stripe Price, Supabase | Hygraph |
| SKU | **Hygraph** | Stripe `lookup_key`, Supabase | Hygraph |
| Stock on hand | **Supabase** | — | Admin console (and Hygraph restock field, §7.5) |
| Reservations | **Supabase** | — | system only |
| Orders, line items, fulfillment | **Supabase** | — | Admin console |
| Customers, addresses, order history | **Supabase** | Stripe Customer | system |
| Promo codes | **Stripe** | redemptions logged to Supabase | Stripe dashboard or admin |
| Tax rates and calculation | **Stripe Tax** | stored on order | — |
| Shop page copy, FAQ, policies, banner | **Hygraph** | — | Hygraph |

**The rule, for the founders:** *Hygraph is what we sell and what it costs. The admin console is what we have and what's been ordered.*

### 4.3 Why Stripe Checkout and not our own payment form

A hosted redirect keeps the Foundation in **PCI SAQ A** — roughly 31 self-assessment items. Embedding card fields in our own pages moves us to **SAQ A-EP**, roughly 195 items, and pulls in PCI DSS 4.0 requirements **6.4.3** (inventory and integrity-verify every script on the payment page) and **11.6.1** (weekly tamper detection on payment page content and headers), both mandatory since March 31, 2025. A volunteer foundation should not own a weekly script-integrity monitoring program.

It also gets Apple Pay for free: Stripe performs Apple merchant validation on our behalf, so the Foundation needs **no Apple Developer account, no Merchant ID, no certificates, and no merchant-validation endpoint**.

### 4.4 Routing the shop without touching the site

Preferred: add `vercel.json` to the existing project with a rewrite sending `/shop/:path*` to the shop deployment. One config file. No HTML changes. Keeps everything on one domain, which is better for SEO and for trust.

Zero-touch alternative: deploy at `shop.keepherlightalive.com`. Nothing in the existing project changes at all, at the cost of a domain switch mid-journey.

**Recommendation: `/shop` via rewrite**, with the subdomain as the fallback if the rewrite causes any issue with the existing site.

---

## 5. Data model — Supabase

All tables live in a `shop` schema. Row Level Security is **on for every table**, with a default-deny policy; the storefront reads through anon-safe views only, and every write goes through a service-role server route or a `SECURITY DEFINER` function. The anon key never has write access to stock or orders.

### 5.1 Catalog cache

```sql
create table shop.products (
  id                uuid primary key default gen_random_uuid(),
  hygraph_id        text unique not null,
  slug              text unique not null,
  title             text not null,
  subtitle          text,
  description_html  text,
  story_html        text,              -- "why this design exists" (see §20.3 UBIT)
  images            jsonb not null default '[]',
  size_chart_html   text,
  category          text,
  stripe_product_id text unique,
  tax_code          text default 'txcd_30011000',  -- Clothing & Footwear
  is_active         boolean not null default false,
  sort_order        int not null default 0,
  synced_at         timestamptz,
  created_at        timestamptz not null default now()
);

create table shop.variants (
  id                 uuid primary key default gen_random_uuid(),
  product_id         uuid not null references shop.products(id) on delete cascade,
  hygraph_id         text unique not null,
  sku                text unique not null,          -- also the Stripe lookup_key
  option_name        text not null default 'Size',  -- 'Size', 'Color'
  option_value       text not null,                 -- 'L', 'Navy'
  price_cents        int  not null check (price_cents >= 0),
  compare_at_cents   int,
  weight_oz          numeric(6,2),
  stripe_price_id    text,
  stock_qty          int not null default 0 check (stock_qty >= 0),
  reserved_qty       int not null default 0 check (reserved_qty >= 0),
  reorder_point      int not null default 5,
  last_synced_stock  int,          -- see §7.5: guards the Hygraph restock field
  is_active          boolean not null default true,
  sort_order         int not null default 0,
  constraint reserved_within_stock check (reserved_qty <= stock_qty)
);
-- Note on `reserved_within_stock`: it will (correctly) block an operator from
-- reducing stock_qty below currently-reserved units — e.g. discovering damage
-- while checkouts are in flight. The admin console must catch this and say so
-- in plain language: "3 of these are in active checkouts right now. You can
-- reduce stock to 3 or wait ~30 minutes." It must never surface as a raw
-- constraint error. See §12.2.

-- Storefront-facing view. Explicit column list: internal fields
-- (reorder_point, last_synced_stock, hygraph_id) are NOT exposed,
-- and variants of an inactive product are excluded entirely.
create view shop.public_variants as
  select v.id, v.product_id, v.sku, v.option_name, v.option_value,
         v.price_cents, v.compare_at_cents, v.sort_order,
         greatest(v.stock_qty - v.reserved_qty, 0) as available_qty
  from shop.variants v
  join shop.products p on p.id = v.product_id
  where v.is_active and p.is_active;
```

`available_qty` is computed in the view rather than stored, so it can never disagree with its inputs. The view is the **only** variant surface the anon role can read; `shop.variants` itself is denied to anon by RLS.

### 5.2 Reservations — the anti-oversell mechanism

```sql
create table shop.reservations (
  id                 uuid primary key default gen_random_uuid(),
  stripe_session_id  text unique not null,
  status             text not null default 'held'
                     check (status in ('held','converted','released')),
  expires_at         timestamptz not null,
  created_at         timestamptz not null default now()
);

create table shop.reservation_items (
  reservation_id uuid not null references shop.reservations(id) on delete cascade,
  variant_id     uuid not null references shop.variants(id),
  qty            int  not null check (qty > 0),
  primary key (reservation_id, variant_id)
);
```

### 5.3 Orders

**DDL order matters** — `customers` is created before `orders` references it.

```sql
create table shop.customers (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid unique references auth.users(id) on delete set null,
  email         text unique not null,
  full_name     text,
  stripe_customer_id text unique,
  marketing_opt_in boolean not null default false,  -- unchecked by default
  created_at    timestamptz not null default now()
);

create table shop.orders (
  id                  uuid primary key default gen_random_uuid(),
  order_number        text unique not null,        -- KHLA-1042, from a sequence
  customer_id         uuid references shop.customers(id),
  email               text not null,
  stripe_session_id   text unique not null,
  stripe_payment_intent text,
  status              text not null default 'paid'
                      check (status in ('paid','fulfilled','partially_refunded','refunded','cancelled')),
  subtotal_cents      int not null,
  discount_cents      int not null default 0,
  donation_cents      int not null default 0,      -- kept separate on purpose, §19
  shipping_cents      int not null default 0,
  tax_cents           int not null default 0,
  total_cents         int not null,
  promo_code          text,
  shipping_name       text,
  shipping_address    jsonb,
  shipping_method     text,
  fulfillment_method  text default 'ship' check (fulfillment_method in ('ship','pickup')),
  tracking_carrier    text,
  tracking_number     text,
  shipped_at          timestamptz,
  promised_ship_by    date not null,               -- drives the FTC delay notice, §20.5
  delay_notice_sent_at timestamptz,
  notes               text,
  created_at          timestamptz not null default now()
);

create table shop.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references shop.orders(id) on delete cascade,
  variant_id     uuid references shop.variants(id),
  sku            text not null,
  title_snapshot text not null,      -- what it was called when sold
  option_snapshot text,
  unit_price_cents int not null,     -- what it cost when sold
  qty            int not null check (qty > 0),
  line_total_cents int not null
);
```

Line items snapshot title and price. A product renamed or repriced next year must not rewrite last year's order.

### 5.4 Promos, campaigns, ledger, webhook dedupe

```sql
create table shop.promo_redemptions (
  id          uuid primary key default gen_random_uuid(),
  code        text not null,
  order_id    uuid not null references shop.orders(id) on delete cascade,
  discount_cents int not null,
  redeemed_at timestamptz not null default now()
);

create table shop.campaigns (
  id          uuid primary key default gen_random_uuid(),
  code        text unique not null,
  purpose     text not null,
  channel     text,                    -- where it was published
  starts_at   date,
  ends_at     date,
  max_redemptions int,
  created_by  text,
  created_at  timestamptz not null default now()
);

create table shop.inventory_ledger (
  id          bigserial primary key,
  variant_id  uuid not null references shop.variants(id),
  delta       int not null,
  reason      text not null
              check (reason in ('restock','sale','refund_restock','manual_adjust',
                                'event_out','event_return','damaged','shrinkage')),
  order_id    uuid references shop.orders(id),
  actor       text,
  note        text,
  created_at  timestamptz not null default now()
);

create table shop.webhook_events (
  provider    text not null,          -- 'stripe' | 'hygraph'
  event_id    text not null,
  received_at timestamptz not null default now(),
  primary key (provider, event_id)
);
```

**`inventory_ledger` is not optional.** Every stock change writes a row. When the monthly physical count disagrees with the system, the ledger is the only way to find out why — and "we gave twelve shirts away at the gala and nobody wrote it down" is the answer roughly every time.

**`webhook_events` is not optional either.** Stripe documents that endpoints "might occasionally receive the same event more than once" and gives **no ordering guarantee**. Insert the event ID first, skip on conflict, then process.

---

## 6. Inventory engine

This is the part with no vendor to fall back on, so it is specified precisely.

### 6.1 The rules

| # | Rule |
|---|---|
| N1 | `available = stock_qty − reserved_qty`. Only `available` is ever shown or sold. |
| N2 | Stock is reserved **at checkout session creation**, not at add-to-cart. A cart is a wish; a checkout is a claim. |
| N3 | Reserving increments `reserved_qty` inside a **single Postgres transaction with row locks**. It does *not* touch `stock_qty` — that happens on payment (N5). Two simultaneous buyers of the last shirt cannot both win. |
| N4 | A reservation expires. Stripe sessions are created with `expires_at` at the **30-minute minimum** (Stripe's floor; the default of 24 hours would let one abandoned cart hold the last large all day). |
| N4a | **The reservation always outlives the Stripe session.** `reservations.expires_at = stripe_expires_at + 15 minutes` of grace, so a payment that completes at minute 29 and whose webhook lands at minute 31 still finds a live reservation. |
| N5 | Stock is only truly decremented on `checkout.session.completed` **with `payment_status === 'paid'`**. Session `status: 'complete'` alone is not sufficient — Stripe's own docs note payment processing may still be in progress. |
| N6 | Every path is idempotent. Webhooks arrive more than once and out of order. |
| N7 | A sweep job is the safety net for a webhook that never arrives — but it **asks Stripe** before releasing anything (§6.4). It never guesses. |
| N8 | Conversion never fails the customer. If a paid order arrives against a reservation that was already released, the order is still created and the discrepancy is flagged for the operator (§6.3). Money received always becomes an order. |

### 6.2 Reserve — atomic, in one function

```sql
create or replace function shop.reserve_stock(
  p_session_id text,
  p_items      jsonb,        -- [{"variant_id":"…","qty":2}, …]
  p_ttl_minutes int default 45
) returns uuid
language plpgsql
security definer
set search_path = shop, pg_catalog
as $$
declare
  v_res  uuid;
  v_id   uuid;
  v_qty  int;
  v_avail int;
begin
  -- TTL is clamped server-side. The caller cannot pin stock indefinitely.
  if p_ttl_minutes is null or p_ttl_minutes < 5 or p_ttl_minutes > 120 then
    p_ttl_minutes := 45;
  end if;

  insert into shop.reservations (stripe_session_id, expires_at)
  values (p_session_id, now() + make_interval(mins => p_ttl_minutes))
  returning id into v_res;

  -- Lock in a DETERMINISTIC order (variant_id ascending) so two concurrent
  -- multi-line carts touching the same variants can never deadlock.
  for v_id, v_qty in
    select (e->>'variant_id')::uuid, (e->>'qty')::int
    from jsonb_array_elements(p_items) e
    order by (e->>'variant_id')::uuid
  loop
    select stock_qty - reserved_qty into v_avail
      from shop.variants
     where id = v_id
       for update;                       -- blocks concurrent reservers

    if v_avail is null or v_avail < v_qty then
      raise exception 'INSUFFICIENT_STOCK:%', v_id
        using errcode = 'P0001';
    end if;

    update shop.variants
       set reserved_qty = reserved_qty + v_qty
     where id = v_id;

    insert into shop.reservation_items (reservation_id, variant_id, qty)
    values (v_res, v_id, v_qty);
  end loop;

  return v_res;
end $$;

-- The function is SECURITY DEFINER, so it must NOT be callable by the public.
revoke execute on function shop.reserve_stock(text, jsonb, int) from public, anon, authenticated;
grant  execute on function shop.reserve_stock(text, jsonb, int) to service_role;
```

**Three things in that function are load-bearing, and all three were bugs in an earlier draft:**

1. **`SELECT … FOR UPDATE`** is what makes N3 true. Without the row lock, two concurrent requests both read `available = 1` and both succeed.
2. **`ORDER BY variant_id`** is what prevents deadlock. Locking in cart order means session A can hold X while waiting for Y as session B holds Y waiting for X; Postgres then aborts one with a deadlock error — which is *not* the `INSUFFICIENT_STOCK` exception the checkout handler catches, so the customer gets a 500 instead of "that size just sold out." Deterministic lock ordering removes the cycle.
3. **The `REVOKE`** is what stops abuse. Supabase exposes functions over PostgREST RPC by default. Left executable by `anon`, this function would let anyone create reservations against arbitrary stock and pin it. Execution is granted to `service_role` only, meaning it is reachable exclusively from the server-side checkout route — which is also where rate limiting lives (§16). The TTL is clamped in the function body rather than trusted from the caller, for the same reason.

If `reserve_stock` raises, no Stripe session is created and the customer sees "Sorry — that size just sold out" with the offending line identified.

### 6.3 Convert and release

**`convert_reservation(session_id, paid_items)`** — on a paid webhook. In one transaction:

1. Lock the reservation row.
2. If `status = 'held'` → for each item `stock_qty -= qty`, `reserved_qty -= qty`; mark `converted`; write `inventory_ledger` rows with reason `sale`.
3. If `status = 'converted'` → **no-op, return the existing order.** This is the duplicate-webhook path and it must be silent.
4. If `status = 'released'` → **the late-payment path (see below).** Decrement `stock_qty` directly, without touching `reserved_qty` (the reservation already gave its hold back). If `stock_qty` would go negative, clamp it at zero, create the order anyway, and set `orders.status = 'paid'` with `orders.notes` flagging **`OVERSOLD — verify stock before shipping`**, plus an immediate operator email.

**Step 4 is the fix for a real hole.** Consider: the customer pays at minute 29, but Stripe's webhook is delayed — by a retry, a redeploy, a slow handler, or an async payment method that settles later. Meanwhile the reservation expired and the sweep released the hold, and in the worst case someone else bought the freed unit. Money has been taken. Three outcomes were possible in an earlier draft of this design, and two of them were unacceptable: silently never decrementing stock (inventory drift, and a paid order nobody picks), or driving `reserved_qty` negative and tripping the check constraint so that order creation *fails for a customer who already paid*.

**The rule is N8: money received always becomes an order.** Never fail a paid customer to protect a number. Create the order, flag it, and let a human resolve it — the Foundation would rather apologize for a two-week backorder than lose the record of a payment.

Two mitigations make step 4 rare rather than routine:

- **The grace window (N4a).** Reservations live 15 minutes longer than the Stripe session, so ordinary webhook latency never reaches this path.
- **The sweep asks Stripe first (§6.4).** It does not release on a timestamp alone.

**`release_reservation(session_id, reason)`** — on `checkout.session.expired`, on cancel, or from the sweep. Guarded by `status = 'held'`, so a duplicate webhook is a no-op. Decrements `reserved_qty` only.

**Refunds** — on `charge.refunded`, update the order status and restock the refunded lines with reason `refund_restock`. **[DECISION NEEDED: D4]** — restock automatically, or flag for operator confirmation? **Recommend flagging**: a returned shirt is not automatically resalable, and auto-restocking a damaged return puts an unsellable unit back on the site.

### 6.4 The sweep

A `pg_cron` job every 10 minutes handles reservations where `status = 'held' AND expires_at < now()`. For each one it **queries the Stripe API for the session's actual status** before doing anything:

| Stripe says | Sweep does |
|---|---|
| `expired` | Release the reservation |
| `complete` + `payment_status = 'paid'` | **Convert it** — a webhook was missed |
| `open` (still payable) | Extend the reservation and leave it alone |
| Session not found | Release, and log for the developer |

Releasing on a timestamp alone would be exactly the bug §6.3 step 4 exists to catch; asking Stripe means the sweep is a repair mechanism rather than a second source of races. It also then reconciles `reserved_qty` against the sum of still-held reservation items and logs any drift.

It runs as **Supabase `pg_cron`**, not a Vercel cron: Vercel's Hobby plan caps cron at once per day with up to 59 minutes of imprecision, and even on Pro, keeping the job next to the data is simpler and has no cold start.

### 6.5 Low stock

`available_qty <= reorder_point` marks a variant low. The admin console dashboard shows a low-stock panel first thing, and a daily `pg_cron` job emails the operator a digest through Resend if anything is at or below its reorder point. This closes the gap Shopify itself leaves open — Shopify has no native low-stock alerting on any plan.

### 6.6 Event stock

Events are modeled as a ledger movement, not a separate location: `event_out` (negative) when merchandise leaves for an event, `event_return` (positive) for what comes back. The website immediately stops selling what is physically in someone's car. The admin console has an "Event checkout / check-in" screen that writes these rows.

**[DECISION NEEDED]** — will volunteers take card payments at events? If yes, the simplest answer is a **Stripe Tap to Pay** reader or the Stripe Dashboard mobile app, with the sale recorded as an `event_out` movement. Building full POS is out of scope for v1.

---

## 7. The Hygraph → Stripe → Supabase sync

This is G2, the thing the client actually asked for. A founder publishes in Hygraph and the product is live and buyable.

### 7.1 Hygraph models

Following this project's existing conventions: `localize: true` on user-facing text, asset fields created in the Hygraph UI rather than via API, reserved words renamed (`resourceType`, `eventStatus` precedent).

**`ShopProduct`**

| Field | Type | Req | Loc | Notes |
|---|---|---|---|---|
| `title` | String | ✓ | ✓ | |
| `slug` | String, unique | ✓ | — | URL and stable identity |
| `subtitle` | String | | ✓ | |
| `descriptionBody` | RichText | ✓ | ✓ | Fabric, fit, care |
| `storyBody` | RichText | ✓ | ✓ | Why this design exists — **required**, see §20.3 |
| `productImages` | Asset (multiple) | ✓ | — | Min 3. Hygraph CDN URLs go straight to Stripe (max 8). |
| `sizeChart` | RichText | | — | |
| `productCategory` | Enum `apparel · coin · accessory` | ✓ | — | Not `category` — reserved |
| `taxCode` | String | | — | Default `txcd_30011000` (Clothing & Footwear); coins use `txcd_99999999` **[VERIFY against `GET /v1/tax_codes`]** |
| `variants` | Component (multiple) → `ShopVariant` | ✓ | — | |
| `isActive` | Boolean | ✓ | — | Unpublishing also works; this is the softer switch |
| `sortOrder` | Int | ✓ | — | |

**`ShopVariant`** (component)

| Field | Type | Req | Notes |
|---|---|---|---|
| `sku` | String | ✓ | Unique across the store. Becomes the Stripe `lookup_key`. |
| `optionName` | String | ✓ | `Size`, `Color` |
| `optionValue` | String | ✓ | `L`, `Navy` |
| `priceCents` | Int | ✓ | Cents. Avoids float rounding. |
| `compareAtCents` | Int | | For strike-through pricing |
| `weightOz` | Float | ✓ | Feeds shipping |
| `stockOnHand` | Int | | **Restock field only — see §7.5.** Leave blank in normal editing. |
| `variantActive` | Boolean | ✓ | |

Plus **`ShopPageSetting`** (singleton: hero copy, impact statement, free-shipping threshold, empty-state message), **`ShopFaqItem`** (`question`, `answer`, `sortOrder`, `faqCategory` — not `category`), **`ShopPolicy`** (`slug`, `title`, `body`, `lastReviewed`), and **`ShopBanner`** (`message`, `linkUrl`, `isActive`, `startsAt`, `endsAt`).

Hygraph's free tier allows **20 models and 10 components** — this fits alongside the nine models already in use, but leaves little headroom. The 1,000-entry cap is comfortable for a product catalog; it is another reason orders live in Supabase and not here.

### 7.2 The sync flow

```
Founder clicks Publish in Hygraph
        │
        ▼
Hygraph webhook  (Content → Published, models: ShopProduct, ShopPageSetting,
                  ShopFaqItem, ShopPolicy, ShopBanner)
        │  signed payload
        ▼
POST /api/webhooks/hygraph
        │
        ├─ 1. verify signature; dedupe on event id  → 200 immediately
        │
        ├─ 2. re-query Hygraph Content API for the full published entry
        │     (never trust the webhook body as complete)
        │
        ├─ 3. upsert shop.products
        │
        ├─ 4. upsert Stripe Product
        │        idempotency-key: hygraph-product-{id}-{revision}
        │        name, description, images[], metadata{hygraph_id, slug},
        │        tax_code, active
        │
        ├─ 5. for each variant — reconcile the price:
        │        find Price by lookup_key = sku
        │        if none            → create Price (lookup_key = sku)
        │        if amount changed  → create new Price with the SAME lookup_key
        │                             and transfer_lookup_key: true,
        │                             then archive the old Price (active: false)
        │        if unchanged       → no-op
        │
        ├─ 6. upsert shop.variants (price, sku, stripe_price_id, weight, active)
        │
        ├─ 7. apply the restock guard (§7.5)
        │
        └─ 8. revalidate the Next.js catalog cache for that slug
```

### 7.3 Why `lookup_key` is the linchpin

**Stripe Price objects are immutable on amount.** Stripe's documentation is explicit: after creation you can only update `metadata`, `nickname`, `active`, `lookup_key`, `currency_options`, `tax_behavior`, and `transfer_lookup_key`. You cannot change `unit_amount`.

The naive consequence is that every price change creates a new `price_xxx` ID that must be written back somewhere. `lookup_key` removes that problem entirely: set the SKU as the price's lookup key, and `transfer_lookup_key: true` atomically moves the key from the old Price to the new one. The application always resolves *"the current price for SKU `KHLA-TEE-NVY-L`"* and never stores a mutable Stripe ID as a source of truth. Old prices stay archived and valid, so historical sessions and receipts remain intact.

**This is the single design decision that makes CMS-driven pricing safe.**

### 7.4 Sync guarantees

- **Idempotency keys** on every Stripe write (`Idempotency-Key`, up to 255 chars, replayed for at least 24 hours), derived from the Hygraph entry ID and revision, so a retried webhook cannot duplicate a Product or Price.
- **Dedupe table** on `(provider, event_id)`.
- **Return 200 fast**, then process — Stripe and Hygraph both retry on non-2xx.
- **Reconciliation job** nightly: walk every active Hygraph product, compare against Stripe and Supabase, repair drift, and email the developer a diff if anything was repaired. A missed webhook must not silently mean an unbuyable product.
- **Manual "Resync" button** in the admin console for the case where someone needs it now.

### 7.5 The restock field problem, and its solution

Founders want to set stock where they set everything else. Stock is also a live counter that orders decrement. If every publish wrote `stockOnHand` into `stock_qty`, then editing a typo in a description would silently reset stock to whatever number was typed weeks ago.

**The guard:** the sync compares `stockOnHand` to `variants.last_synced_stock`.

- Unchanged → **stock is not touched.** Ordinary edits are safe.
- Changed → set `stock_qty` to the new value, write an `inventory_ledger` row with reason `restock` recording the delta, and update `last_synced_stock`.

So a founder can restock from Hygraph, and can also ignore the field entirely and work from the admin console. Both work; neither clobbers the other.

**The field is an absolute count, not a delta — and that has to be unambiguous to a non-technical operator.** Two failure modes follow from getting it wrong, and both are handled explicitly:

| Failure | Guard |
|---|---|
| Magaly types `20` meaning *"20 more arrived"* when 35 are on hand → stock silently drops to 20 | The Hygraph field is labelled **"Total on hand after counting — not the number that just arrived."** More importantly, the sync **never lowers stock silently**: if the new value is *less* than current `stock_qty`, it applies the change but emails the operator *"Stock for KHLA-TEE-NVY-L was reduced from 35 to 20 — was that intended?"* Restocks that go up are silent; anything that goes down is announced. |
| A restock happens to equal the last synced number (she always orders 24) → the guard sees no change and ignores a real restock | The admin console's Inventory screen is the **primary** restock path and has no such ambiguity. The Hygraph field is documented as the convenience path, with this exact caveat noted in the runbook. Alternatively **[DECISION NEEDED]**: add a `restockBatchId` text field the operator changes per delivery, making every restock unambiguous at the cost of one more thing to type. |

The plainest framing for the runbook: *"Count what's on the shelf. Type that number. Not the number in the box you just opened."*

### 7.6 What sync does not do

It never writes back to Hygraph. Hygraph's Management API is unavailable on the free tier, and one-directional flow is easier to reason about. Everything derived — Stripe IDs, stock, sales — lives downstream.

---

## 8. Checkout

### 8.1 Flow

```
Cart (client state, persisted in localStorage)
   │  POST /api/checkout  { items, email?, locale, donation? }
   ▼
Server route:
   1. re-price every line from Supabase — NEVER trust client prices
   2. shop.reserve_stock(...)   ← fails fast if anything is unavailable
   3. stripe.checkout.sessions.create({...})
   4. store session id on the reservation
   ▼
302 → Stripe hosted Checkout
   · Apple Pay / Google Pay / Link buttons at the top
   · card form below
   · promo code box
   · shipping address + shipping options
   · tax calculated by Stripe Tax
   · donation add-on as an optional item
   ▼
success_url → /shop/thank-you?session_id={CHECKOUT_SESSION_ID}
cancel_url  → /shop/cart?canceled=1   (releases the reservation)
```

**Re-pricing server-side is non-negotiable.** The cart is client state and a client can send anything. Every line's price comes from `shop.variants` at session creation, and Stripe receives `price` IDs resolved by lookup key — never a client-supplied amount.

### 8.2 Session parameters

| Parameter | Value | Why |
|---|---|---|
| `mode` | `payment` | One-time purchase |
| `line_items[].price` | resolved from `lookup_key = sku` | §7.3 |
| `line_items[].adjustable_quantity` | `{enabled: true, minimum: 1, maximum: available_qty}` | Let buyers change quantity without returning to the cart |
| `expires_at` | now + 30 min | Stripe's minimum; the default 24h holds stock far too long |
| `allow_promotion_codes` | `true` | Stripe renders the code box; the customer types it |
| `automatic_tax` | `{enabled: true}` | Florida destination tax |
| `shipping_address_collection` | `{allowed_countries: ['US']}` | v1 is domestic only |
| `shipping_options` | up to 5 rates, cheapest first | Flat rate + free-over-threshold + local pickup |
| `optional_items` | donation Price (max 10 optional items) | §19 |
| `consent_collection.terms_of_service` | `required` | Forces acceptance; needs a ToS URL configured in Stripe settings |
| `consent_collection.promotions` | `auto` | Marketing opt-in, unchecked by default |
| `custom_fields` | up to 3 — e.g. "In memory of…" on the coin | Optional personalization |
| `after_expiration.recovery` | `{enabled: true}` | Abandoned-cart recovery link |
| `locale` | `'en'` or `'es'` | Stripe Checkout supports `es` and `es-419` natively |
| `client_reference_id` | reservation id | Reconciliation |
| `metadata` | reservation id, cart hash, locale | Reconciliation |
| `customer_email` | if known | One fewer field |
| `submit_type` | `pay` | `donate` is reserved for a pure-donation flow |

### 8.3 UX rules

These come from published checkout research and each maps to a measured abandonment cause. Roughly 70% of carts are abandoned; the top reasons are extra costs (~40%), forced account creation (~18%), and a long or complicated checkout (~17–22%), against an industry average of 11.3 form fields.

- **Guest checkout is the only path in v1.** Account creation is offered *after* purchase, on the thank-you page.
- **Shipping cost is visible in the cart**, before the redirect. Never a surprise on the payment screen.
- **The free-shipping threshold shows as progress**: "You're $18 away from free shipping."
- **Wallet buttons sit above the form** — Stripe Checkout does this by default; do not override it.
- **Stock urgency is honest.** "Only 3 left" appears only when `available_qty <= 3`, because it is true.
- **The cart is never silently wrong.** If a line became unavailable, say which one.
- Mobile: correct `inputmode` on our own forms, autocorrect off for address fields.

### 8.4 Apple Pay

Delivered entirely by Stripe Checkout. The Foundation does **not** need an Apple Developer account, a Merchant ID, certificates, or a merchant-validation endpoint — Stripe performs Apple merchant validation on our behalf and explicitly instructs integrators not to follow Apple's own merchant-validation process.

Required steps:

1. Register `keepherlightalive.com` (and `www`) at **Stripe Dashboard → Settings → Payment method domains**, or `POST /v1/payment_method_domains`. Do this in **both test and live mode**.
2. Enable Apple Pay, Google Pay, and Link in Dashboard → Payment methods.
3. HTTPS with valid TLS — already satisfied by Vercel.
4. **[VERIFY]** on a real iPhone before launch. Do not take this on faith.

No extra fee: wallet payments process at the standard card rate.

Apple Pay on the web now works in Chrome, Edge, Firefox, and Opera on macOS, and in Chrome, Firefox, and Edge on iOS 16+. It is not available in Chrome on Android — which is why Google Pay is enabled alongside it.

**Do not put a payment iframe on our own pages.** Apple Pay in a cross-origin iframe requires Safari 17+ with `allow="payment"` and silently fails elsewhere. The redirect sidesteps this permanently.

---

## 9. Webhooks

### 9.1 Stripe → us

| Event | Action |
|---|---|
| `checkout.session.completed` **and `payment_status === 'paid'`** | Convert reservation → decrement stock → create order + items → upsert customer → log promo redemption → send confirmation email |
| `checkout.session.async_payment_succeeded` | Same as above, for delayed payment methods |
| `checkout.session.expired` | Release the reservation |
| `checkout.session.async_payment_failed` | Release the reservation; notify the operator |
| `charge.refunded` | Update order status; restock per §6.3 |
| `charge.dispute.created` | Notify the operator immediately — $15 dispute fee, and evidence is time-limited |

### 9.2 Handler requirements

- **Verify the signature** on the raw request body. Stripe's default tolerance is 5 minutes. In Next.js, disable body parsing for this route or the raw body is lost and every signature fails — a classic first-day bug.
- **Insert `(provider, event_id)` into `webhook_events` first.** Conflict means already processed; return 200 and stop.
- **Return 200 before slow work.** A non-2xx or a timeout triggers a retry; Stripe retries for up to **three days** with exponential backoff in live mode.
- **Assume no ordering.** Stripe explicitly does not guarantee event order.
- **Assume duplicates.** Stripe explicitly warns endpoints may receive the same event more than once.
- **Never fulfill on `status: 'complete'` alone.** Check `payment_status`.

### 9.3 Hygraph → us

Signature-verified, deduped, and it **re-queries the Content API** for the entry rather than trusting the webhook payload to be complete. Hygraph's free tier allows **5 webhooks**, which is enough: one publish trigger scoped to the shop models.

---

## 10. Storefront

### 10.1 Pages

| Route | Rendering | Notes |
|---|---|---|
| `/shop` | ISR, revalidated on Hygraph publish | Banner, hero, impact, grid, FAQ |
| `/shop/p/[slug]` | ISR + client stock check | Product detail; stock fetched live so it is never stale |
| `/shop/cart` | Client | Cart, promo preview, donation toggle |
| `/shop/thank-you` | Server | Order summary + optional account creation |
| `/shop/account` | Server, auth-gated | Order history |
| `/shop/track` | Server | Email + order number lookup, no account needed |
| `/shop/admin/*` | Server, role-gated | Operator console (§12) |
| `/shop/shipping`, `/return-policy`, `/terms-of-sale` | ISR from Hygraph | Policy pages |

Product content renders statically; **stock is always fetched live**. Static stock is stale stock, and stale stock is an oversell.

### 10.2 Design continuity

The shop is a different codebase but must not look like one. Port the design system from `docs/SOP.md` into Tailwind theme tokens: Playfair Display for headings, Inter for body, Ocean Deep `#1A4D6D`, Gentle Wave `#4A90B5`, Sunlight Gold `#F4D03F`, Charcoal `#2C3E50`, Memorial Navy `#0D2E47`. Minimum 80px between sections. The same header and footer markup as the main site.

**Note:** Sunlight Gold `#F4D03F` fails 4.5:1 contrast against white and must never carry body text on a white background. It is an accent, not a text color.

### 10.3 Bilingual

The existing site uses `data-i18n` keys in `translations.js`. The shop app uses Next.js i18n with a JSON message catalog — a different mechanism for the same result, because bolting the static site's system onto a React app would be worse than either.

| Content | Source |
|---|---|
| UI strings | Shop app message catalog (`en.json` / `es.json`) |
| Product titles, descriptions, story | Hygraph localized fields, `locale: es` |
| Shop copy, FAQ, policies | Hygraph localized fields |
| Checkout | Stripe `locale: 'es'` |
| Emails | Locale-specific Resend templates |

Hygraph's free tier allows exactly **2 locales** — EN and ES, with nothing to spare.

**Machine translation is a draft, not a deliverable.** Every Spanish string must be reviewed by a native-speaking founder before launch. This community is largely Cuban-American; translation that is technically correct but tonally foreign will be noticed. This review is a launch blocker.

### 10.4 Performance and SEO

LCP under 2.5s on mobile 4G. CLS under 0.1 — reserve image aspect ratios. Product images through `next/image` against the Hygraph CDN, WebP, lazy below the fold. `Product` and `Offer` JSON-LD per product, extending the existing structured-data approach. Add shop routes to `sitemap.xml`.

**[DECISION NEEDED]** — Spanish URL strategy. The existing site points both `en` and `es` `hreflang` at the same URL, which is already imprecise. The shop should either use `/shop/es/...` with correct `hreflang`, or commit to a single URL. Pick one.

---

## 11. Customer accounts

Optional, always. Nobody is blocked from buying.

- **Guest checkout** is the default and the only path during checkout.
- **`/shop/track`** — order number plus email, no account. This covers the majority of "where is my order" traffic.
- **Accounts via Supabase Auth**, magic link only. No passwords to store, reset, or breach.
- **Account creation is offered on the thank-you page**, after the money is in: "Want to see this order later? We'll email you a link."
- On signup, `shop.customers.auth_user_id` links, and any past orders matching that verified email attach to the account.
- **`/shop/account`** lists orders with status and tracking. RLS restricts every row to `auth.uid()`.

Stripe's Customer Portal is deliberately not used — it is built for subscription and invoice management and has essentially nothing to show a one-time merchandise buyer. There is no Stripe-native order-history page for one-time purchases; ours is the only one.

---

## 12. Admin console

At `/shop/admin`, gated by **Supabase Auth with an `admin` claim on the user's JWT** — set via a Supabase custom-claims hook, checked server-side on every admin route and enforced again by RLS policies on admin-only tables. 2FA required. (The `SHOP_ADMIN_ALLOWED_EMAILS` env var in Appendix C is the **bootstrap** list only: it seeds who may be granted the claim in the first place. It is not the runtime authorization check, and no route should ever read it to make an access decision.) Built for someone who has never seen a database.

### 12.1 Screens

**Dashboard** — orders needing shipping, low-stock list, revenue this month, and any sync errors. Low stock is the first thing on the page because it is the thing that is easiest to miss.

**Orders** — filterable list; detail view showing items, address, payment, tax, promo, donation. Actions: mark fulfilled with carrier and tracking (sends the shipping email), print packing slip, refund, add a note, resend confirmation.

**Fulfillment queue** — the volunteer's screen. Select unfulfilled orders → print packing slips → **export a Pirate Ship CSV** → paste tracking numbers back in bulk. Pirate Ship charges no monthly fee and no per-label markup, gives USPS Commercial rates, and imports addresses from a spreadsheet, so no API integration is required.

**Inventory** — every variant with on-hand, reserved, available, and reorder point. Adjust stock with a required reason, which writes to the ledger. Event check-out and check-in.

**Promotions** — create a code (percent, amount, or free shipping) with a usage cap and an end date. Creating a code writes a `shop.campaigns` row capturing purpose and channel, so attribution context lives in the system rather than in someone's head. The screen shows `times_redeemed` from Stripe alongside revenue attributed from `promo_redemptions`.

**Customers** — list, order history, marketing consent state.

**Reports** — monthly board report: units by product, gross revenue, cost of goods, net, donations collected, promo performance, stock on hand, stockouts.

**Sync** — last Hygraph sync per product, errors, and a manual Resync button.

### 12.2 Non-negotiables

- No raw IDs on screen. Order numbers, product names, SKUs — never UUIDs.
- Every destructive action confirms and is reversible or logged.
- Works on a phone. Orders get checked from the couch.
- Every error message says what to do next, not what went wrong internally.

---

## 13. Promotions

Codes live in **Stripe** (Coupon + Promotion Code), created from the admin console or the Stripe dashboard.

Stripe supports what is needed natively: `max_redemptions`, `expires_at`, `restrictions.minimum_amount`, `restrictions.first_time_transaction`, and `active: false` to deactivate without deleting. `times_redeemed` is exposed on the API object and in the dashboard.

Redemptions are **also** written to `shop.promo_redemptions` at order creation, so revenue attribution can be joined against orders — Stripe knows how many times a code was used; only our database knows what those orders were worth after shipping and tax.

**Operating rules:** one code per campaign, never recycled — a recycled code makes attribution meaningless. Naming `<CHANNEL><CAMPAIGN><YEAR>`: `IGLAUNCH2026`, `WALKMIAMI2026`. Every code gets a usage cap and an end date at creation; an uncapped code with no expiry is how a nonprofit ends up honoring 40% off forever because it leaked to a coupon site. Purpose and channel are captured in `shop.campaigns` at creation time by the admin form — there is no separate spreadsheet to maintain.

---

## 14. Shipping and fulfillment

| Setting | Value |
|---|---|
| Origin | Foundation address, Florida **[DECISION NEEDED]** |
| Carrier | USPS via Pirate Ship; UPS for heavy multi-item |
| Rates | Flat rate by cart value, plus free over threshold **[DECISION NEEDED: threshold]** |
| Local pickup | Offered — free, and removes shipping from the equation for Miami-Dade buyers |
| International | Off in v1 |
| Promised processing | 3–5 business days, stored per order in `promised_ship_by` |
| Labels | Pirate Ship — no monthly fee, no per-label fee, USPS Commercial rates, CSV import |
| Packaging | Poly mailers for apparel, rigid boxes for coins |

Flat rate is recommended over live carrier rates for v1: it is predictable, it can be stated truthfully on the product page before the cart, and it removes an entire category of checkout surprise.

Every parcel includes a branded card with the Foundation's story, the Instagram handle, and a QR code to the water-safety resources. It costs almost nothing and it is the mission — a shirt that arrives with a safety checklist does the job the shirt was sold to do.

---

## 15. Transactional email

Resend, on the Foundation's own sending domain with SPF, DKIM, and DMARC configured. The free tier allows 3,000 emails per month capped at 100 per day, which is ample at this volume.

| Email | Trigger |
|---|---|
| Order confirmation | `checkout.session.completed`, paid |
| Shipping notification with tracking | Operator marks fulfilled |
| Delay notice | `promised_ship_by` approaching and unfulfilled — **legally required, §20.5** |
| Refund confirmation | Refund processed |
| Magic link | Account sign-in |
| Low-stock digest | Daily `pg_cron`, only when something is low |
| Abandoned cart | Stripe `after_expiration.recovery` link |

Every template is branded and carries the Foundation's legal name, EIN, and the receipt language in §19.3. **That language is a compliance requirement, not copy.**

---

## 16. Security

| Area | Requirement |
|---|---|
| Card data | Never touches our domain. Stripe Checkout only. PCI **SAQ A**. |
| Supabase keys | Service-role key server-side only, in Vercel env vars. Anon key is read-only via RLS. |
| RLS | On for every table, default deny. Customers see only their own orders. Stock and orders are never writable by the anon role. |
| Price integrity | Every line re-priced server-side from Supabase. Client prices are display only. |
| Webhook auth | Signature verification on Stripe and Hygraph. Raw body preserved. |
| Admin | Supabase Auth + `admin` role claim + mandatory 2FA. |
| Secrets | Vercel environment variables. Nothing in the repo. Note the existing `website/cms.js` hardcodes a Hygraph read token in client JS — acceptable for a public read-only token, but **do not repeat that pattern** for anything writable. |
| Rate limiting | On `/api/checkout` and `/api/webhooks/*` — reservation creation is an abusable endpoint. |
| Rich text | Sanitize all Hygraph HTML with DOMPurify before rendering. The existing `cms.js` has a `safeHTML` placeholder that returns its input unchanged; it must be replaced before shop policy copy — which is legally consequential — is rendered anywhere. |
| PII | Addresses in Supabase, encrypted at rest by default. No card data, ever. Documented retention period. |
| Backups | **Free-tier Supabase has no automated backups.** See §22. |

---

## 17. Accessibility

WCAG 2.1 AA, matching the commitment already in `docs/SOP.md`.

- Full keyboard operation: grid, variant selection, cart, admin.
- Cart drawer as a proper modal — focus trapped, `Escape` closes, focus returns to the trigger.
- Variant and stock state announced to screen readers; never color alone.
- 4.5:1 contrast minimum. Sunlight Gold `#F4D03F` is an accent only.
- Descriptive alt text on every product image, authored in Hygraph.
- Visible focus indicators throughout.
- Automated scan (axe) in CI, plus a manual keyboard and screen-reader pass on the full purchase flow before launch.

Nonprofit status confers no ADA Title III exemption, there is no safe-harbor threshold for small organizations, and interactive commerce flows are precisely what accessibility demand letters target. Building to AA now is far cheaper than remediating after a letter.

---

## 18. Product requirements

Every product needs, before it goes live:

- **At least 3 images** — front flat-lay, back, worn. Square, ≥1200×1200, under 300KB.
- **A size chart** with real measurements in inches and centimeters.
- **A story paragraph** — why this design exists, tied to the mission. **Required**, and §20.3 explains why it is not decoration.
- **Fabric, fit, and care.**
- **Alt text** on every image.
- **A SKU** following `KHLA-<TYPE>-<COLOR>-<SIZE>` — e.g. `KHLA-TEE-NVY-L`. This goes on the storage bin label so a volunteer can match a pick list to a physical stack without reading a title.

Sold-out variants are shown, greyed, unselectable — never hidden. A visible sold-out large tells a buyer the shirt is real and popular.

**[DECISION NEEDED]** Final SKU list, colorways, prices, and supplier.

---

## 19. Donations at checkout

### 19.1 Mechanism

An optional donation line item on every Checkout Session, using Stripe's `optional_items` (max 10 per session). Either a set of fixed Prices ($5 / $10 / $25) or a single Price with `custom_unit_amount` for pay-what-you-want. **[VERIFY]** the exact `custom_unit_amount` parameters against Stripe's hosted-checkout docs before implementing.

Donation amounts are stored in `orders.donation_cents`, separate from `subtotal_cents`, and never mixed into merchandise revenue.

### 19.2 Why the separation is structural, not cosmetic

The tax treatment is completely different, and mixing them creates a real problem.

**A $40 shirt sold at fair market value is not a charitable contribution.** None of it is deductible. The IRS treats a purely commercial transaction — its own example is a museum gift shop — as having no donative element. Telling a buyer otherwise on a receipt is wrong.

**A separate $10 donation with no goods received is fully deductible**, because there is no exchange.

Keeping them distinct means the customer's records are right, the Foundation's gift accounting is right, the Form 990 split between program revenue and contributions is right, and the UBIT analysis in §20.3 has clean numbers.

### 19.3 Receipt language

**Merchandise at fair market value — the normal case:**

> Thank you for your purchase supporting Keep Her Light Alive Foundation, Inc. This transaction is a purchase of merchandise, not a charitable contribution, and is not tax-deductible. Keep Her Light Alive Foundation, Inc. is a 501(c)(3) tax-exempt organization; our EIN is [XX-XXXXXXX].

**A separate donation line, when present:**

> Thank you for your generous gift of $[amount] to Keep Her Light Alive Foundation, Inc., a 501(c)(3) tax-exempt organization (EIN [XX-XXXXXXX]). No goods or services were provided in exchange for this contribution, and it is fully tax-deductible to the extent allowed by law. Please retain this receipt for your tax records.

**If an item is ever priced deliberately above fair market value** — a $100 commemorative coin whose fair market value is $25 — a quid pro quo disclosure is required for any such payment **over $75**, stating the fair market value and that only the excess is deductible. Failure to disclose carries a penalty of $10 per contribution, capped at $5,000 per fundraising event. **Do not price above fair market value without adding this disclosure.**

A single donation of **$250 or more** requires a contemporaneous written acknowledgment for the donor to claim it. Build it into the template now rather than discovering it in April.

**A CPA must review these templates before launch.**

---

## 20. Compliance

> **Informational research, not legal or tax advice.** Confirm with a Florida nonprofit attorney and a CPA before launch. These are cheap to handle now and expensive later.

### 20.1 Florida sales tax — the distinction that catches nonprofits

**Being exempt from paying sales tax is not the same as being exempt from collecting it.**

The Foundation's **Consumer's Certificate of Exemption (DR-14)** exempts the Foundation's *own purchases* — blank shirts, printing, supplies. It does **not** exempt the Foundation from collecting tax when it sells to the public. The Florida Department of Revenue states that a nonprofit selling taxable items "must register with the Department to collect, report, and remit sales tax," and a published Technical Assistance Advisement on a nonprofit gift shop reaches the same conclusion.

The narrow Florida carve-outs for a nonprofit's *sales* — religious institutions, and organizations benefiting minors selling **donated** property below half of fair market value — do not describe an awareness foundation selling newly manufactured apparel at retail. **No general "occasional sale" exemption was found that would cover a continuously operating online store.**

| # | Action |
|---|---|
| T1 | Register as a Florida sales tax dealer (**Form DR-1**) before the first sale. |
| T2 | Collect **6% state tax plus the destination county's discretionary surtax** on Florida-shipped orders — the surtax follows the **delivery** county, not ours. |
| T3 | File **Form DR-15**. Above $1,000 of tax collected per year, filing is **monthly** — a bar this store crosses quickly. |
| T4 | Enable Stripe Tax with the Florida registration recorded. **Without a registration in the customer's jurisdiction, Stripe returns zero tax** — enabling `automatic_tax` alone collects nothing. |
| T5 | Set the origin address in Stripe to the **ship-from** location. |
| T6 | Set `tax_code` per product: `txcd_30011000` (Clothing & Footwear) for apparel; coins need a general-goods code **[VERIFY via `GET /v1/tax_codes`]**. |

**A Florida-specific gotcha worth telling the bookkeeper:** Florida caps the discretionary surtax at the first $5,000 of a single item, and because of that cap, Stripe's location summary report does not render for Florida. **Florida reconciliation must use Stripe's raw tax exports, not the summary report.**

Stripe Tax costs approximately **0.5% per transaction** on the pay-as-you-go tier — roughly $9/month at 50 orders of $35.

### 20.2 Other states

Economic nexus thresholds are **per state**, most commonly $100,000 in sales, sometimes with a 200-transaction alternative — though several states have dropped the transaction count recently (Utah July 2025, Illinois January 2026). At tens of thousands of dollars spread nationwide, no other state's threshold is likely to be crossed.

Track revenue and order count by state, review quarterly, and register only once a threshold is actually crossed. **Do not register preemptively** — it creates a permanent filing obligation, including zero returns, for no benefit.

### 20.3 UBIT

Income is unrelated business income if it is a trade or business, regularly carried on, **not substantially related** to the exempt purpose. A year-round store satisfies the first two. The third is genuinely unsettled for awareness merchandise.

**The related argument:** apparel carrying the water-safety message, Stephanie's name, and a link to safety resources is itself public education about boating safety. This is materially stronger when the merchandise carries real informational content than when it is a logo on a blank.

**The unrelated argument:** generic branded apparel sold at retail looks like commercial merchandising run by a nonprofit, and the IRS has issued no categorical ruling that awareness apparel is automatically related.

**The exception that may matter more:** IRC **§513(a)(1)** excludes a trade or business in which **substantially all the work is performed by volunteers without compensation**. The Foundation's model — founders and volunteers packing and shipping — may well qualify. The donated-goods exception does not apply, since inventory is purchased.

**Requirements:**

- At **$1,000** of gross unrelated business income, file **Form 990-T**. Net is taxed at the flat **21%** corporate rate; cost of goods and a fair share of fulfillment overhead are deductible against it.
- **Design the merchandise so the related-purpose argument is real** — this is why §18 makes the story paragraph and the safety-resource QR code mandatory rather than optional.
- **Get a CPA read on the actual designs and copy** before launch and take a documented position.
- Watch the proportion. If merchandise ever becomes the Foundation's primary activity, that is a separate and more serious exempt-status question.

### 20.4 Charitable solicitation

Florida's Solicitation of Contributions Act (Chapter 496) requires charities soliciting from Florida residents to register with **FDACS**, with fees scaling by prior-year contributions **[VERIFY current schedule]**. Organizations under $50,000 annually whose fundraising is entirely by unpaid volunteers may file an exemption instead. Renewal is annual; late renewal accrues $25/month.

**This bears on §19:** the checkout donation add-on is a solicitation. Wherever donations are solicited, Florida's required disclosure must appear:

> A COPY OF THE OFFICIAL REGISTRATION AND FINANCIAL INFORMATION MAY BE OBTAINED FROM THE DIVISION OF CONSUMER SERVICES BY CALLING TOLL-FREE WITHIN THE STATE, 1-800-HELP-FLA (435-7352), OR VISITING www.FDACS.gov. REGISTRATION DOES NOT IMPLY ENDORSEMENT, APPROVAL, OR RECOMMENDATION BY THE STATE. FLORIDA REGISTRATION #[CH#####].

**[VERIFY — do not copy the above blind.]** The statement is prescribed by Fla. Stat. §496.411 and its exact required wording, including whether the website reference and registration number must appear, has been revised over time. **Pull the current model text directly from FDACS or from the statute before it is published anywhere**, and insert the Foundation's actual `CH` registration number. A disclosure that is close but not current is worse than useless.

**[DECISION NEEDED]** — does soliciting donations nationwide trigger registration beyond Florida? Worth a conversation with counsel.

### 20.5 FTC Mail Order Rule

The clearest mandatory federal rule here, and it has an **operational** component, not just a policy page.

- A stated shipping timeframe needs a reasonable basis. With no stated timeframe, the default is **30 days**.
- If the promised window cannot be met, the Foundation must — **before it expires** — send a delay notice giving a definite revised ship date (or stating none can be given), clearly offering cancellation for a full refund, and providing a **free way to cancel**.
- Delays of 30 days or less: silence counts as consent. Longer or indefinite: **affirmative consent required**, or cancel and refund.
- Cash, check, and money-order refunds within **7 working days**.

**This is why `promised_ship_by` and `delay_notice_sent_at` are columns on the orders table and not an afterthought.** A daily job flags orders approaching their promised date and prompts the operator to send the notice from a pre-written template. A backordered hoodie during a holiday rush is exactly when this rule bites, and exactly when nobody remembers it exists.

### 20.6 Required policies

| Policy | Status |
|---|---|
| Shipping policy with honest timeframes | **Required** (FTC) |
| Return/refund policy, disclosed before purchase | **Required in effect** — undisclosed policies are an FTC §5 exposure and a guaranteed chargeback loss |
| Terms of sale | Contractually necessary; also the ToS URL for `consent_collection` |
| Privacy policy covering shop data | **Required** — state privacy laws and Stripe's merchant terms |
| Tax shown separately at checkout | Stripe default |
| Florida solicitation disclosure | **Required** where donations are solicited |

All linked from the shop footer and referenced at checkout.

### 20.7 Refund economics

**Stripe does not return the processing fee on a refund.** A refunded $50 order still costs the Foundation the original 2.9% + $0.30. Disputes cost **$15** each. The return policy should account for this — and it is a reason to invest in accurate size charts and photography, since a prevented return is worth more than a smooth one.

### 20.8 PCI

Stripe Checkout (hosted redirect) keeps the Foundation at **SAQ A**. Complete the annual self-assessment through Stripe's compliance tooling. **Never add a card field to any Foundation domain.** See §4.3.

---

## 21. Analytics

| Question | Source |
|---|---|
| Revenue, orders, average order value | Supabase queries → admin Reports |
| Checkout funnel: viewed → cart → session created → paid | Supabase (sessions vs orders) |
| Payment method split (how much is Apple Pay?) | Stripe dashboard |
| Top products and variants; dead SKUs | Supabase `order_items` |
| Promo performance | Stripe `times_redeemed` + `promo_redemptions` |
| Revenue by state (nexus monitoring) | Supabase `shipping_address` |
| Donation attach rate | `orders.donation_cents` |
| Stockouts and lost sales | `inventory_ledger` + out-of-stock views |

The monthly board report is generated from these — one page, ten minutes, and it is what turns "we sell shirts" into a program the board can evaluate.

---

## 22. Cost — the honest number

### 22.1 Recurring

| Item | Optimistic | Recommended | Note |
|---|---|---|---|
| **Vercel** | $0 (Hobby) | **$20/mo** (Pro) | **Hobby prohibits commercial use.** Vercel's Fair Use Guidelines: Hobby is "non-commercial personal use only"; commercial usage includes "any method of requesting or processing payment," and explicitly *"Asking for Donations fall under commercial usage."* This is not a gray area. |
| **Supabase** | $0 (Free) | **$25/mo** (Pro) | Free projects **pause after 7 days of inactivity** and must be resumed manually — no auto-resume on traffic. Free has **no automated backups at all**. For a database holding orders and customer addresses, that is a real risk. |
| **Hygraph** | $0 | $0 | Hobby is genuinely sufficient: webhooks (5) included, 1,000 entries, 500k API calls, 2 locales, 20 models, 10 components. Management API and scheduled publishing are not on free — neither is needed. |
| **Stripe** | $0 | $0 | No monthly fee. |
| **Resend** | $0 | $0 | 3,000/mo, 100/day free. |
| **Pirate Ship** | $0 | $0 | No monthly fee, no per-label markup. |
| **Domain** | ~$1/mo | ~$1/mo | |
| **Fixed monthly** | **~$1** | **~$46** | |

**Per-transaction (unavoidable, not a subscription):** Stripe 2.9% + $0.30 ≈ **$66/mo** at 50 orders × $35. Stripe Tax ≈ **$9/mo**. Postage ≈ $4–9 per parcel, passed through to the customer.

**Realistic total at 50 orders/month: ~$46 fixed + ~$75 in processing = ~$121/month**, against ~$1,750 in gross sales.

### 22.2 On the two paid lines

**Vercel Pro at $20 is not optional if the terms matter.** The Foundation's existing PayPal donate button already places the current site in commercial territory under the same clause, so this is a pre-existing exposure the shop only makes visible. Vercel's Open Source Program offers $3,600 in credit over 12 months, but requires the project to be fully open source — worth considering, and a real decision, since a nonprofit publishing its storefront code is not unreasonable. **[DECISION NEEDED]**

**Supabase Pro at $25 buys two things: no pausing, and daily backups.** The pausing risk is concrete — a quiet week with no site traffic pauses the database, and the store breaks until someone notices and clicks Resume. It can be mitigated for free with a GitHub Actions keepalive pinging the database daily, but that does not solve the backup problem. **Recommendation: run free during development, move to Pro at launch.** A store holding customer orders and addresses with zero backups is not a defensible position for a board.

### 22.3 One-time

| Item | Estimate |
|---|---|
| Build (5–7 weeks) | Developer time |
| Product photography | $0–500 |
| Initial inventory | **[DECISION NEEDED]** |
| Packaging | $150–300 |
| CPA and legal review | **[DECISION NEEDED]** — budget for it |

### 22.4 Margin

Illustrative, pending real supplier quotes. **Net** is price minus landed cost minus the Stripe fee — it excludes shipping and sales tax, which pass through.

| Item | Landed cost | Price | Stripe fee | **Net to Foundation** |
|---|---|---|---|---|
| Tee | ~$9 | $28 | $1.11 | **~$17.89** |
| Hoodie | ~$22 | $52 | $1.81 | **~$28.19** |
| Hat | ~$10 | $26 | $1.05 | **~$14.95** |
| Coin | ~$4 | $15 | $0.74 | **~$10.26** |

Buying inventory carries risk print-on-demand does not: **unsold stock is sunk cost.** Order conservatively on the first buy, across a realistic size curve — a typical unisex run skews M/L/XL, and ordering equal quantities across S–3XL guarantees dead stock at both ends. Reorder against actual demand.

### 22.5 What this actually costs versus Shopify — the uncomfortable comparison

Building instead of buying is usually justified on cost. **Here it is not, and it is better to say so plainly than to discover it in month three.**

| | Shopify Basic | This build (recommended config) |
|---|---|---|
| Platform / infrastructure | $39/mo ($29 billed annually) | $46/mo (Vercel Pro $20 + Supabase Pro $25 + domain $1) |
| Payment processing @ 50 × $35 | ~$66 (2.9% + $0.30) | ~$66 (2.9% + $0.30) |
| Sales tax service | $0 (Shopify Tax free under $100k) | ~$9 (Stripe Tax ~0.5%) |
| **Monthly total** | **~$105** | **~$121** |
| Up-front build | none | **5–7 weeks of development** |

**The custom build costs roughly $16/month more than Shopify Basic, plus several weeks of work.** There is no break-even. Anyone who tells the board this saves money is wrong.

It can be made cheaper, and the levers are real:

| Configuration | Fixed | Total/mo | The trade |
|---|---|---|---|
| Recommended | $46 | ~$121 | Backups and no pausing |
| Supabase free + keepalive | $21 | ~$96 | **No automated backups** on a database holding customer orders |
| Vercel OSS credit + Supabase free | ~$1 | ~$76 | Above, plus the storefront source must be public |

So the honest floor is around **$76/month** with two meaningful compromises, against Shopify's $105 with none.

**Then why build it?** Four reasons, none of which is the monthly bill:

1. **Ownership of the customer relationship and the data.** Orders, emails, and purchase history live in a Postgres database the Foundation controls, not in a platform account.
2. **No platform risk.** Nobody can change pricing, deprecate an API, or alter terms underneath the Foundation. This PRD's own v1 was invalidated because Shopify deprecated the JS Buy SDK and excluded Apple Pay from the Buy Button channel — that is exactly the risk being bought out of.
3. **The workflow the client actually asked for.** Products authored in Hygraph, flowing automatically to the payment processor, is the specific requirement (G2). No off-the-shelf platform delivers that; every one of them wants to be the catalog.
4. **Unlimited extensibility.** Donation add-ons, event inventory movements, memorial personalization, bilingual content shared with the main site — all straightforward here, all fighting the platform elsewhere.

**And the honest counter-argument, stated once, clearly:** Shopify's admin is more mature than anything built here in six weeks. It comes with support, with security patches nobody has to remember, and with edge cases already solved by ten years of other merchants hitting them first. Choosing to build means the Foundation and its developer now own the bugs, the oversell races, the PCI paperwork, and the question at 10pm on a Saturday. See R10 and R17.

**That trade has been made deliberately, at the client's direction, with the numbers above on the table.**

## 23. Rollout

### Phase 0 — Foundations (week 1)

- [ ] Stripe account; register `keepherlightalive.com` + `www` as payment method domains (test **and** live); enable Apple Pay, Google Pay, Link.
- [ ] **Verify Apple Pay end to end on a real iPhone with a $1 test order.** Gate for everything else.
- [ ] Supabase project; schema; RLS policies; `pg_cron`.
- [ ] Hygraph models created; one test product authored.
- [ ] Next.js project on Vercel; env vars; `/shop` rewrite tested against the live site with **zero regression**.
- [ ] Florida DR-1 registration filed.
- [ ] CPA engaged for UBIT posture and receipt templates.
- [ ] SKU list, supplier, first inventory order.

### Phase 1 — Catalog and sync (weeks 2–3)

- [ ] Hygraph webhook → Stripe Product/Price sync with `lookup_key` and `transfer_lookup_key`.
- [ ] Idempotency keys, dedupe table, nightly reconciliation, manual Resync.
- [ ] Restock guard (§7.5).
- [ ] Catalog and product pages with live stock.
- [ ] Design system ported; EN/ES scaffolding.
- [ ] **Test: a founder creates a product in Hygraph and it appears purchasable within a minute, unaided.**

### Phase 2 — Checkout and orders (weeks 3–5)

- [ ] Cart; `/api/checkout` with server-side re-pricing and atomic reservation.
- [ ] Stripe Checkout with all parameters from §8.2.
- [ ] Stripe webhooks: completed, expired, async, refunded, dispute.
- [ ] Order creation, stock decrement, ledger, customer upsert.
- [ ] Sweep job.
- [ ] Resend templates with §19.3 language.
- [ ] Stripe Tax live with Florida registration.
- [ ] **Concurrency test: 20 simultaneous checkouts against 1 unit of stock. Exactly one succeeds.**

### Phase 3 — Admin, accounts, promos, donations (weeks 5–6)

- [ ] Full admin console (§12).
- [ ] Pirate Ship CSV export and bulk tracking import.
- [ ] Supabase Auth accounts, `/shop/account`, `/shop/track`.
- [ ] Promo creation and redemption reporting.
- [ ] Donation add-on with correct receipting.
- [ ] Low-stock digest; delay-notice job.
- [ ] Event check-out / check-in.

### Phase 4 — Hardening and launch (week 7)

- [ ] Spanish review by a native-speaking founder — **launch blocker**.
- [ ] Accessibility audit: axe plus manual keyboard and screen-reader pass.
- [ ] Performance: LCP < 2.5s mobile.
- [ ] Policy pages published; privacy policy updated; solicitation disclosure placed.
- [ ] Supabase Pro; backups verified by an actual restore test.
- [ ] Operator runbook and recorded walkthrough.
- [ ] Full smoke test (Appendix B).
- [ ] Home page announcement block and nav link.
- [ ] Soft launch to the founders' networks before public announcement.

---

## 24. Risks

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | **Oversell under concurrency** | Medium | High | `SELECT … FOR UPDATE` with deterministic lock ordering; 20-way concurrency test as a Phase 2 exit gate |
| R1a | **Late payment against an expired reservation** | Medium | High | 15-minute grace window (N4a); sweep queries Stripe before releasing; conversion never fails a paid customer, it flags (§6.3 step 4) |
| R2 | **Supabase free tier pauses; store goes down** | Medium | High | Supabase Pro at launch; GitHub Actions keepalive as interim |
| R3 | **No backups on free tier; data loss** | Low | Severe | Pro before real orders; verify with a restore test, not a checkbox |
| R4 | Missed Stripe webhook leaves stock reserved or an order uncreated | Medium | Medium | Sweep job; nightly reconciliation; 3-day Stripe retry; dedupe table |
| R5 | Hygraph sync drift — product live in CMS but unbuyable | Medium | Medium | Nightly reconciliation with an emailed diff; manual Resync; admin sync screen |
| R6 | Price edited in Hygraph doesn't reach Stripe | Low | High | `transfer_lookup_key` pattern; reconciliation compares amounts |
| R7 | **Restock field clobbers live stock** | Medium | High | `last_synced_stock` guard (§7.5); field labelled in Hygraph; ledger makes it visible |
| R8 | Vercel pauses the deployment for Hobby ToS violation | Low–Medium | High | Vercel Pro from launch |
| R9 | Apple Pay doesn't work as expected | Low | High | Verified with a real device in Phase 0, before anything is built on it |
| R10 | Custom build has bugs Shopify wouldn't | **High** | Medium | This is the accepted cost of the decision. Mitigate with the test gates in §23 and §26, a soft launch, and week-1 monitoring. |
| R11 | Sales tax not collected or filed | Medium | High | Register before first sale; Stripe Tax; a **named person** owning DR-15 filing |
| R12 | UBIT position wrong | Medium | Medium | CPA review of actual designs; merchandise designed to carry real mission content |
| R13 | FTC delay notice never sent | Medium | Medium | `promised_ship_by` column, daily job, template in the runbook |
| R14 | Unsold inventory | Medium | Medium–High | Conservative first buy; realistic size curve; reorder on data |
| R15 | Accessibility demand letter | Low–Medium | Medium–High | WCAG 2.1 AA from the start; axe in CI |
| R16 | Machine-translated Spanish reads as foreign | Medium | Medium | Native-speaker review is a launch blocker |
| R17 | **Developer unavailable; nobody can maintain it** | Medium | High | This is the genuine cost of owning the stack. Mitigate with documented architecture, this PRD, a recorded walkthrough, and a written recovery note stating that Stripe holds the money, Supabase holds the orders, and Hygraph holds the catalog — so a successor can rebuild the frontend without losing anything. |

**R10 and R17 deserve a straight word.** Building instead of buying trades a monthly fee for ownership *and* for responsibility. Shopify would have absorbed the bugs, the oversell edge cases, the PCI paperwork, and the 2am support question. Those now belong to the Foundation and its developer. That is a legitimate trade — it is just worth naming, so nobody is surprised in month four.

---

## 25. Open decisions

| # | Decision | Blocks |
|---|---|---|
| D1 | Final products, colorways, prices, supplier | §18, first inventory order |
| D2 | Flat rate or live rates? Free-shipping threshold? | §14 |
| D3 | Return window; who pays return shipping; are coins final sale? | Return policy, §6.3 |
| D4 | Auto-restock on refund, or flag for operator confirmation? | §6.3 |
| D5 | EIN and 501(c)(3) determination status | §19.3, §20 |
| D6 | Who owns monthly sales tax filing? | §20.1 |
| D7 | Which founder is the store operator of record? | §12 |
| D8 | Ship-from address | §14, Stripe Tax origin |
| D9 | Vercel Pro, or open-source the storefront for the OSS credit? | §22.2 |
| D10 | Supabase Pro at launch — confirm the $25 | §22.2 |
| D11 | Spanish URL strategy | §10.4 |
| D12 | Card payments at events — Stripe Tap to Pay? | §6.6 |
| D13 | Budget for CPA and legal review | §20 |
| D14 | Does the donation add-on trigger multi-state solicitation registration? | §19, §20.4 |

---

## 26. Acceptance criteria

**Customer**

- [ ] First-time visitor on an iPhone goes from `/shop` to a completed Apple Pay order in under 60 seconds.
- [ ] Checkout completes with no account.
- [ ] Shipping cost is visible before the redirect.
- [ ] A promo code applies and the discount is visible before payment.
- [ ] Switching to Spanish translates the shop, product content, and the checkout.
- [ ] A sold-out variant cannot be purchased.
- [ ] Confirmation email arrives within two minutes with correct non-deductibility language.
- [ ] Shipping notification with tracking arrives on fulfillment.
- [ ] `/shop/track` finds an order by number and email.
- [ ] The entire flow is completable by keyboard, and with a screen reader.

**Operator**

- [ ] A founder creates a product in Hygraph and it is live and purchasable within a minute, unaided.
- [ ] Changing a price in Hygraph is reflected at checkout within a minute.
- [ ] Editing a description does **not** alter stock.
- [ ] Setting `stockOnHand` in Hygraph **does** update stock and writes a ledger row.
- [ ] Lowering `stockOnHand` triggers the "was that intended?" email before it is treated as normal.
- [ ] Reducing stock below currently-reserved units shows a plain-language explanation, not a database error.
- [ ] A volunteer processes an order — pick, label via Pirate Ship CSV, mark shipped — in under 5 minutes.
- [ ] A founder creates a capped, dated promo code and sees redemptions.
- [ ] A refund restocks correctly and emails the customer.
- [ ] Low-stock digest arrives when a variant is at its reorder point.

**Technical**

- [ ] **20 simultaneous checkouts against 1 unit: exactly one succeeds.**
- [ ] Replaying a Stripe webhook creates no duplicate order and no double stock movement.
- [ ] **Late-payment race:** pay at minute 29, hold the webhook until minute 40 (past reservation expiry), then deliver it. An order is created, stock is correct, and if stock was already gone the order is flagged `OVERSOLD` and the operator is emailed. **No paid customer is ever left without an order.**
- [ ] **Deadlock test:** two concurrent multi-line carts sharing two variants in opposite order both complete or fail cleanly — neither returns a 500.
- [ ] **RPC lockout:** calling `shop.reserve_stock` directly with the anon key is rejected.
- [ ] Sweep releases only after querying Stripe; a session still `open` at expiry is extended, not released.
- [ ] Killing the webhook endpoint during a purchase, then replaying, produces a correct order.
- [ ] An expired session releases its reservation within 10 minutes.
- [ ] Client-tampered prices are rejected server-side.
- [ ] The anon Supabase key cannot read another customer's order or write stock.
- [ ] LCP < 2.5s on mobile 4G; no console errors.
- [ ] The existing site is byte-identical apart from the nav link, announcement block, and `vercel.json`.
- [ ] A Supabase restore test succeeds.

**Compliance**

- [ ] Florida dealer registration active; Stripe Tax collecting 6% plus destination surtax; a Florida test order shows correct county surtax.
- [ ] Shipping, return, terms-of-sale, and privacy policies published and linked.
- [ ] Solicitation disclosure present wherever donations are solicited.
- [ ] Receipt templates CPA-reviewed.
- [ ] Delay-notice job and template working.
- [ ] WCAG 2.1 AA audit passed.
- [ ] 2FA on Stripe, Supabase, Vercel, and Hygraph.

---

## 27. After launch

Week 1: the developer watches every order. Weeks 2–4: the operator runs it with the developer on call. Month 2 onward: the operator runs it; the developer reviews quarterly — dependency updates, Stripe API version, reconciliation logs, backup restore test.

The measure of success at 90 days is not revenue. It is whether Magaly has needed to call the developer more than twice, and whether a single customer was ever sold something that was not in the box.

---

# Appendices

## Appendix A — Operator runbook (laminate this)

### Add a new product
1. Hygraph → **ShopProduct → Create**
2. Title, slug, subtitle
3. **Description** — fabric, fit, care
4. **Story** — why this design exists *(required — this is what makes the shirt part of the mission)*
5. **Images** — at least 3 (front, back, worn). Write alt text on each.
6. **Category**, **size chart**
7. **Variants** — one per size: SKU, `Size` / `L`, price in **cents** ($28 = `2800`), weight in ounces
8. Leave **Stock on hand** blank for now
9. **Publish**
10. Check `/shop` — it should be there within a minute. If not, open Admin → Sync and press **Resync**.

### Change a price
Hygraph → the variant → new `priceCents` → **Publish.** Live within a minute. Old orders keep their old price.

### Restock after a delivery
Either: Hygraph → variant → set **Stock on hand** → Publish.
Or: Admin → Inventory → **Adjust** → reason **Restock**.
**Count the box. Do not trust the invoice.**

### Process orders (2–3× a week)
1. Admin → **Fulfillment**
2. Select unfulfilled → **Print packing slips**
3. Pick by SKU from the bins
4. Pack; include the slip and a Foundation card
5. **Export Pirate Ship CSV** → upload at pirateship.com → buy and print labels
6. Paste tracking numbers back into Admin → **Mark shipped** → customers are emailed automatically
7. Drop at USPS

### Refund
Admin → the order → **Refund** → choose items → decide whether stock comes back. The customer is emailed.

### Promo code
Admin → **Promotions → New** → type, amount, **usage limit**, **end date**, and *what it's for / where you're posting it* → Save. The campaign record is created for you.

### Before an event
Admin → Inventory → **Event check-out**, enter what you're taking. Check the rest back in the next day. This stops the website selling shirts that are in your car.

### An order will be late
Admin flags orders approaching their promised ship date. Open it → **Send delay notice**. **Do this before the promised date passes — it is a legal requirement, not a courtesy.**

### Something looks wrong
- **Product missing from the shop** → Admin → Sync → Resync
- **Price wrong on the site** → confirm it's published in Hygraph, then Resync
- **Stock looks wrong** → count physically, then Admin → Inventory → Adjust with a reason
- **Anything else** → email the developer. Don't change settings you don't recognize.

### Monthly
First Sunday: count everything, correct the system, note the variance. Then pull the board report.

### Never
- Never promise a ship date you can't meet.
- Never tell a customer their merchandise purchase is tax-deductible. **It isn't.** Donations are; shirts aren't.

---

## Appendix B — Launch smoke test

On real devices, in this order:

1. `/shop` loads under 3s on a phone over cellular.
2. Grid renders; every image has alt text; sold-out variants are visible and unselectable.
3. Add a tee to the cart; price correct; free-shipping progress accurate.
4. Apply a promo code; total updates.
5. Checkout → **Apple Pay button visible on a real iPhone**.
6. Complete a real $1 test order with Apple Pay.
7. Confirmation email arrives, branded, with the non-deductibility line.
8. Order in Admin; stock down by one; ledger row written.
9. Export the Pirate Ship CSV; addresses import correctly.
10. Mark shipped with tracking; shipping email arrives.
11. Refund; stock behavior matches the D4 decision; refund email arrives.
12. Ship to a Florida address — **verify the county surtax is correct**.
13. Switch to Spanish; repeat 1–5; confirm checkout is in Spanish.
14. Complete 3–6 by keyboard only.
15. Run axe — zero critical issues.
16. Open two browsers, both buy the last unit — **exactly one succeeds**.
17. Abandon a checkout; confirm the reservation releases within 10 minutes.
18. Replay a webhook from the Stripe dashboard — no duplicate order.
19. Confirm the main site is unchanged and the nav link works.

---

## Appendix C — Environment variables

```
# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=          # server only — never exposed

# Hygraph
HYGRAPH_ENDPOINT=                   # existing project endpoint
HYGRAPH_READ_TOKEN=                 # read-only, PUBLISHED stage
HYGRAPH_WEBHOOK_SECRET=

# Resend
RESEND_API_KEY=
RESEND_FROM=shop@keepherlightalive.com

# App
NEXT_PUBLIC_SITE_URL=https://keepherlightalive.com
SHOP_ADMIN_ALLOWED_EMAILS=          # bootstrap seed list only — NOT the runtime auth check (§12)
```

The existing project's `.env` already holds `HYGRAPH_ENDPOINT`, `HYGRAPH_MANAGEMENT_TOKEN`, `HYGRAPH_TOKEN`, and `HYGRAPH_STAGE`. The shop reuses the read token and needs no management token.

---

## Appendix D — Decision log

| Decision | Choice | Why |
|---|---|---|
| Commerce platform | **Custom build** | Client direction: no monthly commerce SaaS |
| Payments | Stripe Checkout, hosted | Apple Pay free, PCI SAQ A, promo codes and tax built in, no monthly fee |
| Product authoring | Hygraph | Founders already work there; webhooks on the free tier |
| Catalog sync | Hygraph → Stripe via webhook, keyed on SKU `lookup_key` | Stripe Prices are immutable; `transfer_lookup_key` makes CMS-driven pricing safe |
| Backend | Supabase Postgres | Atomic stock ops, RLS, Auth, already connected |
| Stock reservation | At checkout session creation, `SELECT … FOR UPDATE` | Only way to guarantee no oversell under concurrency |
| Session expiry | 30 minutes (Stripe's minimum) | The 24-hour default holds stock far too long |
| Orders in Supabase, not Hygraph | Yes | Hygraph free tier caps at 1,000 entries; orders are transactional data, not content |
| Hygraph Remote Sources | Rejected | Not on the free tier ($199/mo Growth), and it would create a second copy of stock |
| Shop as a separate Vercel project | Yes | Zero risk to the existing site |
| Route at `/shop` via rewrite | Yes | One config file, same domain, better SEO. Subdomain is the fallback. |
| Framework | Next.js | API routes for webhooks, ISR for catalog, admin app — all in one deploy |
| Customer accounts | Supabase Auth magic link, optional | No passwords; forced accounts drive abandonment |
| Stripe Customer Portal | Rejected | Built for subscriptions; nothing to show a one-time buyer |
| Shipping labels | Pirate Ship | Free, no per-label fee, USPS Commercial rates, CSV import |
| Embedded card fields | Rejected | Would move PCI scope from SAQ A to SAQ A-EP and pull in DSS 4.0 §6.4.3 / §11.6.1 |
| Vercel Pro | Required | Hobby prohibits commercial use, donations included |
| Supabase Pro | Recommended at launch | Free tier pauses after 7 days idle and has no backups |
| Stripe nonprofit rate | Not assumed | Requires ≥80% of volume from tax-deductible donations; merch sales don't qualify |

---

## Appendix E — Sources

**Stripe**
[Manage prices — immutability](https://docs.stripe.com/products-prices/manage-prices) · [Update a price / transfer_lookup_key](https://docs.stripe.com/api/prices/update) · [Metadata limits](https://docs.stripe.com/api/metadata) · [Product object](https://docs.stripe.com/api/products/object) · [Idempotent requests](https://docs.stripe.com/api/idempotent_requests) · [Create a Checkout Session](https://docs.stripe.com/api/checkout/sessions/create) · [Checkout Session object](https://docs.stripe.com/api/checkout/sessions/object) · [Manage limited inventory](https://docs.stripe.com/payments/checkout/managing-limited-inventory) · [Charge for shipping](https://docs.stripe.com/payments/during-payment/charge-shipping) · [Pay what you want](https://docs.stripe.com/payments/checkout/pay-what-you-want) · [Webhooks: retries, duplicates, ordering](https://docs.stripe.com/webhooks) · [Coupons and promotion codes](https://docs.stripe.com/billing/subscriptions/coupons) · [Promotion Code object](https://docs.stripe.com/api/promotion_codes/object) · [Set up Stripe Tax](https://docs.stripe.com/tax/set-up) · [Tax codes](https://docs.stripe.com/tax/tax-codes) · [Collect tax in Florida](https://docs.stripe.com/tax/supported-countries/united-states/collect-tax?tax-jurisdiction-united-states=florida) · [Apple Pay](https://docs.stripe.com/apple-pay?platform=web) · [Payment method domain registration](https://docs.stripe.com/payments/payment-methods/pmd-registration) · [Customer portal](https://docs.stripe.com/customer-management) · [Nonprofit fee discount](https://support.stripe.com/questions/fee-discount-for-nonprofit-organizations) · [Fees on refunds](https://support.stripe.com/questions/understanding-fees-for-refunded-payments)

**Infrastructure**
[Vercel Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines) · [Vercel Terms](https://vercel.com/legal/terms) · [Vercel Hobby plan](https://vercel.com/docs/plans/hobby) · [Vercel Open Source Program](https://vercel.com/open-source-program) · [Vercel cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing) · [Serving multiple projects on one domain](https://vercel.com/kb/guide/how-can-i-serve-multiple-projects-under-a-single-domain) · [Supabase free project pausing](https://supabase.com/docs/guides/platform/free-project-pausing) · [Supabase pricing](https://supabase.com/pricing) · [Hygraph pricing](https://hygraph.com/pricing) · [Hygraph FAQ](https://hygraph.com/faq) · [Resend pricing](https://resend.com/pricing) · [Pirate Ship](https://www.pirateship.com/features) · [Shippo pricing](https://onlineshippingcalculator.com/guides/shippo-pricing-plans-fees-guide) · [EasyPost pricing](https://www.easypost.com/pricing/)

**Checkout UX and PCI**
[Baymard: checkout usability](https://baymard.com/blog/holistic-view-on-checkout-usability) · [Baymard: mobile checkout](https://baymard.com/blog/mobile-checkout) · [Baymard: linear checkout](https://baymard.com/blog/checkout-process-should-be-linear) · [SAQ A vs SAQ A-EP](https://www.foregenix.com/blog/saq-a-vs-saq-a-ep) · [PCI DSS 4.0 §6.4.3 and §11.6.1](https://cside.com/blog/how-to-comply-with-pci-6-4-3)

**Tax, IRS, compliance**
[Florida DOR: nonprofits and sales tax](https://floridarevenue.com/taxes/businesses/Pages/nonprofit_sales_tax.aspx) · [Florida sales and use tax](https://floridarevenue.com/taxes/taxesfees/Pages/sales_tax.aspx) · [Discretionary sales surtax](https://floridarevenue.com/taxes/taxesfees/Pages/discretionary.aspx) · [TAA 14A-022: sales by nonprofits](https://www.floridasalestax.com/taas/taa-14a-022-sales-by-nonprofit-organizations/) · [IRS: UBIT](https://www.irs.gov/charities-non-profits/unrelated-business-income-tax) · [IRS: UBIT exceptions](https://www.irs.gov/charities-non-profits/charitable-organizations/unrelated-business-income-tax-exceptions-and-exclusions) · [IRS: volunteer labor exclusion](https://www.irs.gov/charities-non-profits/volunteer-labor-exclusion-from-unrelated-trade-or-business) · [IRS: quid pro quo contributions](https://www.irs.gov/charities-non-profits/charitable-organizations/charitable-contributions-quid-pro-quo-contributions) · [IRS: substantiation and disclosure](https://www.irs.gov/charities-non-profits/charitable-organizations/charitable-organizations-substantiation-and-disclosure-requirements) · [Florida Statutes Ch. 496](https://www.flsenate.gov/Laws/Statutes/2025/Chapter496/All) · [FDACS solicitation of contributions](https://www.fdacs.gov/Business-Services/Solicitation-of-Contributions) · [FTC Mail Order Rule](https://ftc.gov/business-guidance/resources/business-guide-ftcs-mail-internet-or-telephone-order-merchandise-rule) · [Economic nexus by state 2026](https://www.numeral.com/blog/economic-nexus) · [Nonprofit web accessibility 2026](https://www.clym.io/blog/nonprofit-website-accessibility-guide)

**Internal**
`cms/README.md` · `cms/schema/hygraph-schema.js` · `memory/MEMORY.md` · `docs/SOP.md` · `website/cms.js` · `website/index.html` · `netlify.toml`

---

*Prepared by OAC Digital Innovations for Keep Her Light Alive Foundation, Inc. Compliance sections are informational research, not legal or tax advice; confirm with a Florida nonprofit attorney and a CPA before launch.*
