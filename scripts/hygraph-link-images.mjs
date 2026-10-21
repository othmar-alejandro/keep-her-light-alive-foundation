#!/usr/bin/env node
/**
 * Links each published product to its already-uploaded assets:
 *   storefrontImage <- images[0]
 *   gallery         <- images[1..]
 *
 * Idempotent: re-running reconnects the same assets. Run after
 * hygraph-import.mjs has uploaded the files.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  (await readFile(path.join(ROOT, "shop/.env.local"), "utf8"))
    .split("\n").filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).trim()]; }),
);

async function gql(query, variables = {}) {
  const res = await fetch(env.HYGRAPH_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.HYGRAPH_TOKEN}` },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (body.errors?.length) throw new Error(JSON.stringify(body.errors));
  return body.data;
}

// The app's own catalog is the source of which file belongs to which product.
const source = await readFile(path.join(ROOT, "shop/src/lib/preview-catalog.ts"), "utf8");
const slice = source.slice(
  source.indexOf("export const previewCatalog"),
  source.indexOf("export function groupByCategory"),
);
const { previewCatalog } = await import(
  `data:text/javascript,${encodeURIComponent(
    slice
      .replace(/export const previewCatalog: PreviewProduct\[\] =/, "export const previewCatalog =")
      .replace(/sizeVariants\("([A-Z0-9-]+)"\)/g, (_, p) =>
        JSON.stringify(["S","M","L","XL","2XL","3XL"].map((s) => ({ sku: `${p}-${s}`, optionValue: s }))))
      .replace(/\/\*[\s\S]*?\*\//g, ""),
  )}`
);

const { assets } = await gql(
  `{ assets(stage: DRAFT, first: 200, orderBy: createdAt_DESC){ id fileName width mimeType } }`,
);
// Keep the first processed asset per filename, matching the importer's own pick.
const byName = new Map();
for (const a of assets) if (a.width && a.mimeType && !byName.has(a.fileName)) byName.set(a.fileName, a.id);

let linked = 0, missing = [];
for (const product of previewCatalog) {
  const ids = product.images.map((i) => byName.get(i.file)).filter(Boolean);
  if (!ids.length) { missing.push(product.slug); continue; }
  await gql(
    `mutation Link($slug: String!, $hero: ID!, $rest: [AssetConnectInput!]!) {
       updateShopProduct(where: { slug: $slug }, data: {
         storefrontImage: { connect: { id: $hero } }
         gallery: { connect: $rest }
       }) { id }
     }`,
    { slug: product.slug, hero: ids[0], rest: ids.slice(1).map((id) => ({ where: { id } })) },
  );
  await gql(`mutation P($slug: String!){ publishShopProduct(where:{slug:$slug}, to: PUBLISHED){ id } }`,
    { slug: product.slug });
  linked += 1;
  console.log(`  ${product.slug.padEnd(32)} ${ids.length} image(s)`);
}

const check = await gql(
  `{ shopProducts(stage: PUBLISHED, first: 100){ slug storefrontImage { url } gallery { url } } }`,
);
const withImage = check.shopProducts.filter((p) => p.storefrontImage?.url).length;
console.log(`\nlinked ${linked}/${previewCatalog.length}` +
  (missing.length ? `, no asset for: ${missing.join(", ")}` : "") +
  `\npublished with a storefront image: ${withImage}/${check.shopProducts.length}`);
