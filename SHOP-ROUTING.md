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

**Until step 4 is done the rewrite points at a placeholder, so do not merge
this to `main` — `/shop` would break.** The old static prototype is gone, so
there is no fallback.
