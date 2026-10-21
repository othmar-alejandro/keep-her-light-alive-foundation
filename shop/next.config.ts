import type { NextConfig } from "next";

/**
 * Sent on every response. The CSP is production-only: the dev server needs a
 * websocket and eval for hot reload, and a policy that allowed those would not
 * be the policy that ships.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // No includeSubDomains and no preload. The shop is served from
  // keepherlightalive.com/shop, so this header speaks for the whole domain,
  // and either option would lock every subdomain out of plain HTTP for two
  // years with no way to recall it. Those are opt-ins, once every subdomain
  // is confirmed HTTPS-only.
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
];

// Next inlines its own hydration scripts and Tailwind emits inline styles, so
// 'unsafe-inline' is required until this moves to nonces. It still pins every
// external origin, which is what the CMS-controlled fields need it for.
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://graphassets.com https://*.graphassets.com",
  "font-src 'self' data:",
  "connect-src 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

/**
 * The store is deployed as its own Vercel project and proxied to
 * keepherlightalive.com/shop, so its deployment host answers the same pages on
 * a second address. Anything that is not the canonical domain is told not to
 * index, or the store competes with itself in search.
 */
const CANONICAL_HOST = "www.keepherlightalive.com";

const nextConfig: NextConfig = {
  basePath: "/shop",
  async headers() {
    return [
      {
        source: "/:path*",
        headers:
          process.env.NODE_ENV === "production"
            ? [...securityHeaders, { key: "Content-Security-Policy", value: contentSecurityPolicy }]
            : securityHeaders,
      },
      {
        source: "/:path*",
        missing: [{ type: "host", value: CANONICAL_HOST }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
};

export default nextConfig;
