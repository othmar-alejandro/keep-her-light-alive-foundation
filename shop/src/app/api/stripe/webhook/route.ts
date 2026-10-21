import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { rpc } from "@/lib/shop-db";
import { getStripe, ORDER_ID_PATTERN } from "@/lib/stripe";

// The only place an order becomes paid. The success redirect never does it.
export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Webhook is not configured." }, { status: 503 });
  }
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    // Signature is checked against the raw, unparsed body.
    event = getStripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded" &&
    event.type !== "checkout.session.async_payment_failed" &&
    event.type !== "checkout.session.expired"
  ) {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object;
  const orderId = session.client_reference_id;
  if (!orderId || !ORDER_ID_PATTERN.test(orderId)) {
    // A Session this shop did not create (e.g. another product on the account).
    return NextResponse.json({ received: true });
  }

  try {
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      // `completed` with a delayed payment method is not money yet; the
      // async_payment_* event that follows settles it.
      if (session.payment_status === "paid") {
        const intent = session.payment_intent;
        await rpc<string>("shop_mark_paid", {
          p_event_id: event.id,
          p_order_id: orderId,
          p_session_id: session.id,
          p_payment_intent_id: (typeof intent === "string" ? intent : intent?.id) ?? null,
          p_amount_total: session.amount_total,
          p_email: session.customer_details?.email ?? null,
        });
      }
    } else {
      await rpc<string>("shop_release_order", {
        p_event_id: event.id,
        p_order_id: orderId,
        p_session_id: session.id,
        p_final_status: event.type === "checkout.session.expired" ? "expired" : "canceled",
      });
    }
  } catch (error) {
    // Non-2xx makes Stripe redeliver; the RPCs are idempotent per event ID.
    console.error(`Webhook ${event.id} (${event.type}) failed:`, error);
    return NextResponse.json({ error: "Webhook processing failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
