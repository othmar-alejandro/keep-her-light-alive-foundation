import Stripe from "stripe";

let stripeClient: Stripe | undefined;

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  // Previews and local runs must never take real money. A live key is refused
  // unless the production environment opts in explicitly.
  if (!/^(sk|rk)_test_/.test(secretKey) && process.env.SHOP_LIVE_PAYMENTS !== "true") {
    throw new Error("A live Stripe key is set without SHOP_LIVE_PAYMENTS=true.");
  }

  stripeClient ??= new Stripe(secretKey);
  return stripeClient;
}

export const ORDER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
