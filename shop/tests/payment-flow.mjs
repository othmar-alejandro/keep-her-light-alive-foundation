// Run through payment-flow.sh, which provides Postgres (55442) and PostgREST (55443).
import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import { createHmac, randomUUID } from "node:crypto";
import http from "node:http";
import { createRequire } from "node:module";

const appDir = process.env.APP_DIR;
const Stripe = createRequire(`${appDir}/`)("stripe");
const WEBHOOK_SECRET = "whsec_local_test";
const JWT_SECRET = "local-test-secret-local-test-secret-0000";
const SKU = "KHLA-FLOW-M";
const PRICE = 2800;

const b64 = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
function jwt(role) {
  const body = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ role })}`;
  return `${body}.${createHmac("sha256", JWT_SECRET).update(body).digest("base64url")}`;
}

const sql = (query) =>
  execFileSync("psql", ["-h", "127.0.0.1", "-p", "55442", "-U", "postgres", "-d", "postgres",
    "-v", "ON_ERROR_STOP=1", "-qAt", "-c", query]).toString().trim();

// Stands in for Supabase's /rest/v1 gateway and for Hygraph's published catalog.
let published = true;
const stub = http.createServer((req, res) => {
  if (req.url === "/hygraph") {
    res.setHeader("Content-Type", "application/json");
    return res.end(JSON.stringify({ data: { shopProducts: published ? [{
      slug: "flow-tee", titleEn: "Flow Tee", titleEs: null, descriptionEn: null,
      descriptionEs: null, category: "apparel", sortOrder: 1,
      heroImage: { url: "https://media.graphassets.com/test" },
      variants: [{ sku: SKU, labelEn: "M", labelEs: null, unitAmount: PRICE }],
    }] : [] } }));
  }
  const upstream = http.request(
    { host: "127.0.0.1", port: 55443, method: req.method, headers: req.headers,
      path: req.url.replace(/^\/rest\/v1/, "") },
    (reply) => { res.writeHead(reply.statusCode, reply.headers); reply.pipe(res); },
  );
  req.pipe(upstream);
}).listen(55444);

const next = spawn("node", ["node_modules/next/dist/bin/next", "dev", "-p", "55445"], {
  cwd: appDir,
  stdio: ["ignore", "pipe", "pipe"],
  env: {
    ...process.env,
    NEXT_TELEMETRY_DISABLED: "1",
    STRIPE_SECRET_KEY: "sk_test_local_fake",
    STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
    SUPABASE_URL: "http://127.0.0.1:55444",
    SUPABASE_SERVICE_ROLE_KEY: jwt("service_role"),
    HYGRAPH_ENDPOINT: "http://127.0.0.1:55444/hygraph",
    HYGRAPH_TOKEN: "",
    NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:55445",
  },
});
let nextLog = "";
next.stdout.on("data", (chunk) => { nextLog += chunk; });
next.stderr.on("data", (chunk) => { nextLog += chunk; });

const app = "http://127.0.0.1:55445/shop";
const post = (path, body, headers = {}) =>
  fetch(`${app}${path}`, { method: "POST", body, headers });
const checkout = (body) =>
  post("/api/checkout", JSON.stringify(body), { "Content-Type": "application/json" });

let eventCount = 0;
function webhook(type, orderId, session = {}, { secret = WEBHOOK_SECRET, id } = {}) {
  const payload = JSON.stringify({
    id: id ?? `evt_flow_${++eventCount}`,
    object: "event",
    type,
    data: { object: {
      id: `cs_test_${orderId.slice(0, 8)}`, object: "checkout.session",
      client_reference_id: orderId, payment_status: "paid", payment_intent: `pi_test_${orderId.slice(0, 8)}`,
      amount_total: PRICE, customer_details: { email: "buyer@example.com" }, ...session,
    } },
  });
  const signature = Stripe.webhooks.generateTestHeaderString({ payload, secret });
  return post("/api/stripe/webhook", payload, { "stripe-signature": signature });
}
const reserve = (orderId, quantity = 1) => sql(
  `set role service_role; select public.shop_reserve_order('${orderId}', '${SKU}', 'Flow Tee (M)', ${quantity}, ${PRICE}, now() + interval '41 minutes')`);
const stock = () => sql(`select on_hand || '/' || reserved from public.shop_inventory where sku = '${SKU}'`);
const orderStatus = (orderId) => sql(`select status from public.shop_orders where id = '${orderId}'`);
const statusPage = async (orderId) => {
  const token = sql(`select lookup_token from public.shop_orders where id = '${orderId}'`);
  return (await fetch(`${app}/thank-you?order=${token}`)).text();
};

try {
  for (let i = 0; ; i++) {
    if ((await fetch(`${app}/thank-you`).catch(() => null))?.ok) break;
    assert.ok(i < 120, `next dev did not start:\n${nextLog}`);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert.equal((await fetch("http://127.0.0.1:55444/rest/v1/shop_orders")).status, 401,
    "anonymous callers cannot read orders through the API");
  assert.equal((await fetch("http://127.0.0.1:55444/rest/v1/rpc/shop_expire_holds",
    { method: "POST", headers: { Authorization: `Bearer ${jwt("authenticated")}` } })).status, 403,
    "signed-in non-service callers cannot run stock RPCs");
  sql(`select public.shop_adjust_stock('${SKU}', 2, 'opening')`);

  // --- checkout ---
  const a = randomUUID();
  assert.equal((await checkout({ orderId: a, sku: SKU, quantity: 1, unitAmount: 1 })).status, 502,
    "fake Stripe key: Session creation fails");
  assert.equal(stock(), "2/0", "failed Session creation gives the hold back");
  assert.equal(orderStatus(a), "canceled");
  assert.equal(sql(`select unit_amount from public.shop_order_items where order_id = '${a}'`),
    String(PRICE), "browser-supplied price is ignored; CMS price is snapshotted");
  assert.equal((await checkout({ orderId: a, sku: SKU, quantity: 1 })).status, 409,
    "retry of a released order does not re-reserve");
  assert.equal((await checkout({ orderId: randomUUID(), sku: SKU, quantity: 3 })).status, 409,
    "more than stock is refused");
  assert.equal((await checkout({ orderId: randomUUID(), sku: "KHLA-NOPE", quantity: 1 })).status, 409,
    "unpublished SKU is refused");
  for (const bad of [{ orderId: "x", sku: SKU, quantity: 1 }, { orderId: a, sku: SKU, quantity: 0 },
      { orderId: a, sku: SKU, quantity: 1.5 }, { orderId: a, sku: SKU, quantity: 11 }, null]) {
    assert.equal((await checkout(bad)).status, 400, `rejects ${JSON.stringify(bad)}`);
  }
  published = false;
  assert.equal((await checkout({ orderId: randomUUID(), sku: SKU, quantity: 1 })).status, 409,
    "unpublishing blocks new checkout");
  published = true;
  assert.equal(stock(), "2/0", "no refused request moved stock");

  // --- webhook: signature ---
  const b = randomUUID();
  reserve(b);
  assert.match(await statusPage(b), /confirming your payment/, "pending order shows pending");
  assert.equal((await webhook("checkout.session.completed", b, {}, { secret: "whsec_wrong" })).status, 400);
  assert.equal((await post("/api/stripe/webhook", "{}")).status, 400, "unsigned body rejected");
  assert.equal(orderStatus(b), "pending", "forged event changes nothing");

  // --- webhook: paid exactly once ---
  assert.equal((await webhook("checkout.session.completed", b, { payment_status: "unpaid" })).status, 200);
  assert.equal(orderStatus(b), "pending", "completed-but-unpaid is not paid");
  assert.equal((await webhook("checkout.session.async_payment_succeeded", b, {}, { id: "evt_paid_b" })).status, 200);
  assert.equal(orderStatus(b), "paid");
  assert.equal(stock(), "1/0", "one unit sold");
  await webhook("checkout.session.async_payment_succeeded", b, {}, { id: "evt_paid_b" });
  await webhook("checkout.session.completed", b);
  await webhook("checkout.session.expired", b);
  assert.equal(orderStatus(b), "paid", "replay, duplicate and late expiry keep it paid");
  assert.equal(stock(), "1/0", "stock moved once");
  assert.match(await statusPage(b), /order is confirmed/);
  assert.doesNotMatch(await statusPage(b), /buyer@example\.com/, "status page shows no email");

  // --- webhook: expiry, then a late payment for the last unit ---
  const c = randomUUID();
  reserve(c);
  assert.equal(stock(), "1/1");
  assert.equal((await webhook("checkout.session.expired", c)).status, 200);
  assert.equal(orderStatus(c), "expired");
  assert.equal(stock(), "1/0", "expiry frees the hold");
  assert.match(await statusPage(c), /not completed/);
  const d = randomUUID();
  reserve(d);
  assert.equal((await webhook("checkout.session.completed", c)).status, 200);
  assert.equal(orderStatus(c), "payment_review", "late payment cannot take another buyer's unit");
  assert.equal(stock(), "1/1");
  assert.match(await statusPage(c), /manual review/);
  await webhook("checkout.session.async_payment_failed", d);
  assert.equal(orderStatus(d), "canceled");
  assert.equal(stock(), "1/0");

  // --- webhook: not ours / unknown order ---
  assert.equal((await webhook("checkout.session.completed", "not-a-uuid")).status, 200,
    "foreign Session is acknowledged and ignored");
  assert.equal((await webhook("checkout.session.completed", randomUUID())).status, 500,
    "unknown order asks Stripe to retry");
  assert.match(await (await fetch(`${app}/thank-you?order=${randomUUID()}`)).text(),
    /does not confirm a payment/, "unknown token reveals nothing");

  console.log("payment flow passed");
} finally {
  next.kill();
  stub.close();
  stub.closeAllConnections();
}
