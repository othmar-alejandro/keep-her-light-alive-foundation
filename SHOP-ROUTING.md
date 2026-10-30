# How /shop is served

`keepherlightalive.com` and the store are two Vercel projects on one domain.
This is Next.js's Multi Zones pattern: visitors only ever see one site.

| Project | Root Directory | Serves |
| --- | --- | --- |
| `keep-her-light-alive-foundation` | `website` | the foundation site at `/`, and owns the domain |
| the store project | `shop` | the Next.js store, proxied in at `/shop` |

`website/vercel.json` holds the rewrite that proxies `/shop` to the store.
Vercel validates that file against a strict schema, so it cannot carry
comments of its own — which is why these notes live here instead.

## Current state

The store project `khla-shop` exists and has its three production
environment variables set. It was created with the CLI rather than the
dashboard, because the dashboard's Root Directory picker reads the default
branch and `shop/` does not exist on `main` yet.

Two consequences:

- **It is not connected to Git**, so it does not deploy on push. Connect it
  in Settings -> Git once `shop/` exists on `main`.
- **Its framework preset was "Other"**, which would have built the store as a
  static site. `shop/vercel.json` pins `framework: nextjs` so the preset
  cannot get this wrong.

The rewrite points at `khla-shop.vercel.app`, the alias Vercel derives from
the project name. **Confirm that is the real production host on the first
successful production deploy** -- if the name was taken, Vercel assigns a
suffixed one and the rewrite needs updating to match.

## Setting up the store project, once

1. Vercel -> Add New -> Project -> the same repo.
2. **Root Directory: `shop`.** Framework detects as Next.js on its own.
3. Production environment variables:

   | Variable | Value |
   | --- | --- |
   | `HYGRAPH_ENDPOINT` | the Content API URL for the `master` environment |
   | `HYGRAPH_TOKEN` | the read-only token, never the delete-capable one |
   | `NEXT_PUBLIC_SITE_URL` | `https://www.keepherlightalive.com` |

   Leave `SHOP_OPEN` unset. That is what keeps the store browse-only:
   prices show as provisional and nothing can be bought.

4. Deploy, then copy the project's production host into
   `website/vercel.json` in place of `SHOP_DEPLOYMENT_HOST`.

Production deployments must stay publicly reachable. If Vercel Authentication
is enabled on the store project, the rewrite gets a 401 and `/shop` breaks.

## Why `website/shop/` had to be deleted

Vercel checks the filesystem **before** applying rewrites. While
`website/shop/index.html` existed, `/shop` served that old static prototype
and the rewrite never fired — so the real store would have silently never
appeared, with no error to notice. The prototype is deleted for that reason,
not for tidiness. Do not restore it.

**Consequence: `/shop` now depends entirely on the rewrite.** Until the real
host replaces `SHOP_DEPLOYMENT_HOST`, do not merge this to `main` — there is
no fallback and `/shop` will fail.
