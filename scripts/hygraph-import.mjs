#!/usr/bin/env node
/**
 * Imports the shop catalog into Hygraph: uploads each product image as an Asset,
 * creates/updates the ShopProduct with its variants, then publishes both.
 *
 * Idempotent: products are matched by slug and upserted, so re-running updates
 * in place rather than duplicating. Assets are only re-uploaded when the product
 * has no heroImage yet (`--force-images` overrides).
 *
 *   node scripts/hygraph-import.mjs --dry-run
 *   node scripts/hygraph-import.mjs
 *
 * Reads HYGRAPH_ENDPOINT and HYGRAPH_TOKEN from shop/.env.local.
 * The token needs Create + Update + Publish on ShopProduct, ShopVariant and Asset.
 */
import { readFile } from "node:fs/promises";
import { createReadStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMAGE_DIR = path.join(ROOT, "shop/public/shop");
const DRY_RUN = process.argv.includes("--dry-run");
const FORCE_IMAGES = process.argv.includes("--force-images");

/* ------------------------------------------------------------------ env */
const env = Object.fromEntries(
  (await readFile(path.join(ROOT, "shop/.env.local"), "utf8"))
    .split("\n")
    .filter((line) => /^[A-Z_]+=/.test(line))
    .map((line) => {
      const i = line.indexOf("=");
      return [line.slice(0, i), line.slice(i + 1).trim()];
    }),
);
const ENDPOINT = env.HYGRAPH_ENDPOINT;
const TOKEN = env.HYGRAPH_TOKEN;
if (!ENDPOINT || !TOKEN) {
  console.error("Missing HYGRAPH_ENDPOINT or HYGRAPH_TOKEN in shop/.env.local");
  process.exit(1);
}

/* --------------------------------------------------------------- client */
async function gql(query, variables = {}) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (body.errors?.length) {
    throw new Error(JSON.stringify(body.errors));
  }
  return body.data;
}

/** Reuse an already-processed asset with the same filename instead of re-uploading. */
async function findProcessedAsset(fileName) {
  const found = await gql(
    `query Find($fileName: String!) {
       assets(stage: DRAFT, where: { fileName: $fileName }, orderBy: createdAt_DESC, first: 5) {
         id width mimeType
       }
     }`,
    { fileName },
  );
  return found.assets.find((a) => a.width && a.mimeType)?.id ?? null;
}

/** Hygraph two-step upload: reserve an Asset, then POST the file to S3. */
async function uploadImage(fileName) {
  const reusable = await findProcessedAsset(fileName);
  if (reusable) {
    await gql(
      `mutation Pub($id: ID!) { publishAsset(where: { id: $id }, to: PUBLISHED) { id } }`,
      { id: reusable },
    ).catch(() => {});
    return reusable;
  }
  const created = await gql(
    `mutation Reserve($fileName: String!) {
       createAsset(data: { fileName: $fileName }) {
         id
         upload { requestPostData { url key date policy signature algorithm credential securityToken } }
       }
     }`,
    { fileName },
  );
  const asset = created.createAsset;
  const post = asset.upload?.requestPostData;
  if (!post) throw new Error(`No upload grant for ${fileName}`);

  const form = new FormData();
  form.append("key", post.key);
  form.append("X-Amz-Date", post.date);
  form.append("X-Amz-Signature", post.signature);
  form.append("X-Amz-Algorithm", post.algorithm);
  form.append("policy", post.policy);
  form.append("X-Amz-Credential", post.credential);
  if (post.securityToken) form.append("X-Amz-Security-Token", post.securityToken);

  const bytes = await readFile(path.join(IMAGE_DIR, fileName));
  form.append("file", new Blob([bytes], { type: "image/jpeg" }), fileName);

  const res = await fetch(post.url, { method: "POST", body: form });
  if (!res.ok) throw new Error(`S3 upload failed for ${fileName}: HTTP ${res.status}`);

  // Hygraph ingests the file asynchronously; publishing before it finishes fails
  // with "non complete asset".
  // Processing is usually a few seconds but has taken over 20; be patient rather
  // than failing and leaving an orphan asset behind on every retry.
  let ready = false;
  for (let attempt = 0; attempt < 60 && !ready; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const probe = await gql(
      `query Ready($id: ID!) { asset(where: { id: $id }, stage: DRAFT) { width mimeType } }`,
      { id: asset.id },
    );
    ready = Boolean(probe.asset?.width && probe.asset?.mimeType);
  }
  if (!ready) throw new Error(`Asset never finished processing after 2 min: ${fileName}`);

  await gql(`mutation Pub($id: ID!) { publishAsset(where: { id: $id }, to: PUBLISHED) { id } }`, {
    id: asset.id,
  });
  return asset.id;
}

/* ------------------------------------------------------------- catalog */
// Parsed out of the app's own catalog so the two can never drift.
const source = await readFile(path.join(ROOT, "shop/src/lib/preview-catalog.ts"), "utf8");
const catalogJson = source.slice(
  source.indexOf("export const previewCatalog"),
  source.indexOf("export function getPreviewProduct"),
);
const { previewCatalog } = await import(
  `data:text/javascript,${encodeURIComponent(
    catalogJson
      .replace(/export const previewCatalog: PreviewProduct\[\] =/, "export const previewCatalog =")
      .replace(/sizeVariants\("([A-Z0-9-]+)"\)/g, (_, p) =>
        JSON.stringify(
          ["S", "M", "L", "XL", "2XL", "3XL"].map((s) => ({ sku: `${p}-${s}`, optionValue: s })),
        ),
      )
      .replace(/\/\*[\s\S]*?\*\//g, ""),
  )}`
);

/* -------------------------------------------------------------- import */
const existing = await gql(
  `{ shopProducts(stage: DRAFT, first: 100) { slug heroImage { id } } }`,
);
const bySlug = new Map(existing.shopProducts.map((p) => [p.slug, p]));

console.log(`${DRY_RUN ? "DRY RUN — " : ""}${previewCatalog.length} products\n`);

let created = 0;
let updated = 0;
let uploaded = 0;
let imageless = 0;

for (const [index, product] of previewCatalog.entries()) {
  const prior = bySlug.get(product.slug);
  const needsImage = FORCE_IMAGES || !prior?.heroImage;
  const label = `${product.slug.padEnd(32)} ${product.category.padEnd(10)}`;

  if (DRY_RUN) {
    console.log(
      `  ${label} ${prior ? "update" : "create"}  ${product.variants.length} variants  ` +
        `${needsImage ? "upload hero image" : "image kept"}`,
    );
    continue;
  }

  let heroImageId = prior?.heroImage?.id;
  if (needsImage) {
    heroImageId = await uploadImage(product.images[0].file);
    uploaded += 1;
  }

  const data = {
    slug: product.slug,
    titleEn: product.title.en,
    titleEs: product.title.es,
    descriptionEn: product.description?.en ?? null,
    descriptionEs: product.description?.es ?? null,
    category: product.category,
    sortOrder: index + 1,
    heroImage: { connect: { id: heroImageId } },
  };

  // ShopVariant requires its parent, so the product has to exist first.
  // ShopProduct.heroImage is currently mis-typed in the schema (it expects a
  // ShopProduct connect, not an Asset), so the connect is attempted and the
  // product is still written without it when that fails.
  const write = async (payload) => {
    if (prior) {
      await gql(
        `mutation Upd($slug: String!, $data: ShopProductUpdateInput!) {
           updateShopProduct(where: { slug: $slug }, data: $data) { id }
         }`,
        { slug: product.slug, data: payload },
      );
      updated += 1;
    } else {
      await gql(
        `mutation New($data: ShopProductCreateInput!) { createShopProduct(data: $data) { id } }`,
        { data: payload },
      );
      created += 1;
    }
  };

  try {
    await write(data);
  } catch (error) {
    if (!/heroImage/.test(String(error))) throw error;
    const { heroImage: _omitted, ...withoutImage } = data;
    await write(withoutImage);
    imageless += 1;
  }

  // Upserted by SKU so re-running updates prices instead of duplicating rows.
  for (const variant of product.variants) {
    const fields = {
      sku: variant.sku,
      labelEn: variant.optionValue,
      labelEs: variant.optionValueEs ?? variant.optionValue,
      unitAmount: product.priceCents,
    };
    await gql(
      `mutation Var($sku: String!, $create: ShopVariantCreateInput!, $update: ShopVariantUpdateInput!) {
         upsertShopVariant(where: { sku: $sku }, upsert: { create: $create, update: $update }) { id }
       }`,
      {
        sku: variant.sku,
        create: { ...fields, product: { connect: { slug: product.slug } } },
        update: fields,
      },
    );
    await gql(
      `mutation PubVar($sku: String!) {
         publishShopVariant(where: { sku: $sku }, to: PUBLISHED) { id }
       }`,
      { sku: variant.sku },
    );
  }

  await gql(
    `mutation Pub($slug: String!) {
       publishShopProduct(where: { slug: $slug }, to: PUBLISHED) { id }
     }`,
    { slug: product.slug },
  );

  console.log(`  ${label} ok`);
}

if (!DRY_RUN) {
  const check = await gql(
    `{ shopProducts(stage: PUBLISHED, first: 100) { slug category heroImage { url } variants { sku } } }`,
  );
  const live = check.shopProducts.filter((p) => p.heroImage?.url && p.variants.length);
  console.log(
    `\ncreated ${created}, updated ${updated}, images uploaded ${uploaded}, written without image ${imageless}` +
      `\npublished and renderable: ${live.length}/${previewCatalog.length}`,
  );
}
