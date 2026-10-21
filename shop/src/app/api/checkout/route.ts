import { NextResponse } from "next/server";
import { findSellableVariant } from "@/lib/hygraph-catalog";
import { previewBasePath } from "@/lib/preview-catalog";
import { isShopDbConfigured, rpc, ShopDbError } from "@/lib/shop-db";
import { getStripe, ORDER_ID_PATTERN } from "@/lib/stripe";

// Stripe's minimum Checkout Session lifetime is 30 minutes. The stock hold
// outlives the session, so a payment made in its last seconds still finds it.
const SESSION_MINUTES = 31;
const HOLD_GRACE_MINUTES = 10;
const MAX_QUANTITY = 10;

type Hold = { order_id: string; lookup_token: string; expires_at: string | null };

function fail(status: number, error: string) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!process.env.STRIPE_SECRET_KEY || !isShopDbConfigured() || !siteUrl) {
    return fail(503, "Checkout is not available yet.");
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const orderId = body?.orderId;
  const sku = body?.sku;
  const quantity = body?.quantity;
  const locale = body?.locale === "es" ? "es" : "en";
  if (
    typeof orderId !== "string" || !ORDER_ID_PATTERN.test(orderId) ||
    typeof sku !== "string" || !/^[A-Z0-9-]{1,64}$/.test(sku) ||
    typeof quantity !== "number" || !Number.isInteger(quantity) ||
    quantity < 1 || quantity > MAX_QUANTITY
  ) {
    return fail(400, "Invalid checkout request.");
  }

  // Price and title come from the published catalog, never from the browser.
  const variant = await findSellableVariant(sku);
  if (!variant) {
    return fail(409, "This item is not available.");
  }

  let hold: Hold;
  try {
    [hold] = await rpc<Hold[]>("shop_reserve_order", {
      p_order_id: orderId,
      p_sku: variant.sku,
      p_title: variant.title,
      p_quantity: quantity,
      p_unit_amount: variant.unitAmount,
      p_expires_at: new Date(
        Date.now() + (SESSION_MINUTES + HOLD_GRACE_MINUTES) * 60_000,
      ).toISOString(),
    });
  } catch (error) {
    if (error instanceof ShopDbError && (error.code === "P0001" || error.code === "P0002")) {
      return fail(409, "This item is sold out.");
    }
    if (error instanceof ShopDbError && error.code === "22023") {
      // Same order ID, different contents (for example the price changed).
      return fail(409, "This checkout changed. Please start again.");
    }
    console.error("Checkout reserve failed:", error);
    return fail(500, "Checkout could not be started.");
  }
  if (!hold?.expires_at) {
    // A retry of an order whose hold was already released.
    return fail(409, "This checkout expired. Please start again.");
  }

  const base = `${siteUrl.replace(/\/+$/, "")}${previewBasePath}`;
  const stripe = getStripe();
  let sessionId: string | undefined;
  try {
    // Every parameter is derived from the stored order, so a retry with the
    // same order ID replays the same Session instead of creating a second one.
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        locale,
        client_reference_id: orderId,
        metadata: { order_id: orderId },
        payment_intent_data: { metadata: { order_id: orderId } },
        line_items: [
          {
            quantity,
            price_data: {
              currency: "usd",
              unit_amount: variant.unitAmount,
              product_data: { name: variant.title, metadata: { sku: variant.sku } },
            },
          },
        ],
        expires_at:
          Math.floor(new Date(hold.expires_at).getTime() / 1000) - HOLD_GRACE_MINUTES * 60,
        success_url: `${base}/thank-you?order=${hold.lookup_token}&lang=${locale}`,
        cancel_url: `${base}/p/${variant.slug}?lang=${locale}`,
      },
      { idempotencyKey: `khla-checkout-${orderId}` },
    );
    sessionId = session.id;
    if (!session.url) throw new Error("Stripe returned no Checkout URL.");
    await rpc<string>("shop_attach_session", {
      p_order_id: orderId,
      p_session_id: session.id,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout session failed:", error);
    // Give the units back and make sure nobody can pay on an orphaned Session.
    if (sessionId) {
      await stripe.checkout.sessions.expire(sessionId).catch(() => undefined);
    }
    await rpc<string>("shop_release_order", {
      p_event_id: `local:${orderId}:session_failed`,
      p_order_id: orderId,
      p_session_id: sessionId ?? null,
      p_final_status: "canceled",
    }).catch((releaseError) => {
      // The hold still expires on its own through shop_expire_holds.
      console.error("Checkout release failed:", releaseError);
    });
    return fail(502, "Checkout could not be started.");
  }
}
