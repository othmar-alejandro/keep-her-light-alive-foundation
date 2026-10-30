# Keep Her Light Alive Shop

This is the Track D vertical slice: one hard-coded tee SKU, server-side Stripe Checkout creation, hosted Checkout, and a thank-you page. It intentionally has no database, webhooks, inventory, admin, or donation flow yet.

## Local setup

From this directory:

```bash
cp .env.example .env.local
# Fill in STRIPE_SECRET_KEY and NEXT_PUBLIC_SITE_URL in .env.local.
npm install
npm run dev
```

Open `http://localhost:3000/shop`. For Spanish Checkout, use `http://localhost:3000/shop?lang=es`.

The available scripts are:

```bash
npm run typecheck
npm run lint
npm run build
```

The server resolves Stripe Price by `lookup_key = KHLA-TEE-NVY-M`. If it does not exist, it creates the Stripe Product and Price at runtime using the idempotency key `slice-KHLA-TEE-NVY-M`.

## Apple Pay / Google Pay / Link launch checklist

Stripe Checkout supplies the wallet buttons. Before launch:

1. Register `keepherlightalive.com` and `www.keepherlightalive.com` in Stripe Dashboard → Settings → Payment method domains, in both test mode and live mode.
2. Enable Apple Pay, Google Pay, and Link in Stripe Dashboard → Payment methods.
3. Confirm the deployed site uses HTTPS with valid TLS.
4. Verify the flow with a real $1 order on a real iPhone before launch.

The Stripe-hosted redirect means this app does not need an Apple Developer account, Apple Merchant ID, certificates, or a merchant-validation endpoint.

## Mounting at `/shop`

`next.config.ts` sets `basePath: '/shop'`. Deploy this folder as its own Vercel project, then add the following to `vercel.json` in the existing static project (replace the deployment URL with the real shop deployment URL):

```json
{
  "rewrites": [
    {
      "source": "/shop/:path*",
      "destination": "https://khla-shop.vercel.app/shop/:path*"
    }
  ]
}
```

Do not place real Stripe keys in this repository. Use Vercel environment variables for the deployed app.
