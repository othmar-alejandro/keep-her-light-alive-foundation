import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { tee, type CatalogProduct } from "@/lib/catalog";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";

const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;
// TODO: Replace this process-local limiter with Upstash/Vercel KV in production.
const requestsByIp = new Map<string, { count: number; windowStartedAt: number }>();

function getClientIp(request: Request, requestHeaders: Headers): string {
  return (
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const previous = requestsByIp.get(ip);

  if (!previous || now - previous.windowStartedAt >= RATE_WINDOW_MS) {
    requestsByIp.set(ip, { count: 1, windowStartedAt: now });
    return false;
  }

  previous.count += 1;
  return previous.count > RATE_LIMIT;
}

async function resolvePrice(product: CatalogProduct): Promise<Stripe.Price> {
  const stripe = getStripe();
  const existingPrices = await stripe.prices.list({
    lookup_keys: [product.sku],
    limit: 1,
  });
  const existingPrice = existingPrices.data[0];

  if (existingPrice) {
    if (!existingPrice.active) {
      return stripe.prices.update(existingPrice.id, { active: true });
    }
    return existingPrice;
  }

  // Idempotency keys are global per account (not per endpoint): use a distinct
  // key for the Product and the Price so a retry replays the right response.
  const productKey = `slice-${product.sku}-product`;
  const priceKey = `slice-${product.sku}-price`;
  const stripeProduct = await stripe.products.create(
    {
      name: product.title,
      description: product.description,
      metadata: { sku: product.sku },
    },
    { idempotencyKey: productKey },
  );

  return stripe.prices.create(
    {
      product: stripeProduct.id,
      unit_amount: product.unitAmount,
      currency: product.currency,
      lookup_key: product.sku,
      metadata: { sku: product.sku },
    },
    { idempotencyKey: priceKey },
  );
}

function getSiteUrl(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

  if (!siteUrl) {
    throw new Error("NEXT_PUBLIC_SITE_URL is not configured.");
  }

  return siteUrl;
}

export async function POST(request: Request) {
  const clientIp = getClientIp(request, request.headers);

  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      { error: "Too many checkout attempts. Please try again in a minute." },
      { status: 429 },
    );
  }

  const locale = new URL(request.url).searchParams.get("lang") === "es" ? "es" : "en";
  const stripe = getStripe();
  const price = await resolvePrice(tee);
  const siteUrl = getSiteUrl();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: price.id, quantity: 1 }],
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    allow_promotion_codes: true,
    automatic_tax: { enabled: true },
    shipping_address_collection: { allowed_countries: ["US"] },
    shipping_options: [
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: 500, currency: "usd" },
          display_name: "USPS",
        },
      },
      {
        shipping_rate_data: {
          type: "fixed_amount",
          fixed_amount: { amount: 0, currency: "usd" },
          display_name: "Local pickup — Miami",
        },
      },
    ],
    locale,
    consent_collection: { promotions: "auto" },
    submit_type: "pay",
    success_url: `${siteUrl}/shop/thank-you?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/shop?canceled=1`,
    metadata: { sku: tee.sku, locale },
  });

  if (!session.url) {
    return NextResponse.json({ error: "Stripe did not return a checkout URL." }, { status: 502 });
  }

  return NextResponse.redirect(new URL(session.url), 303);
}
