#!/usr/bin/env node
/**
 * Creates the ShopSection model: one row per storefront section, so an editor
 * can show, hide, reorder and rewrite sections without a deploy.
 *
 * Run once. Safe to re-run: existing models and fields are skipped.
 * Needs HYGRAPH_MANAGEMENT_TOKEN (root .env) with model and field create rights.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  (await readFile(path.join(ROOT, ".env"), "utf8"))
    .split("\n").filter((l) => /^[A-Z_]+=/.test(l))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).trim()]; }),
);
const MGMT = "https://management-us-west-2.hygraph.com/graphql";
const ASSET_MODEL_ID = "1ec0073f594e4750b57e23df287fafaf";

async function gql(query, variables = {}) {
  const res = await fetch(MGMT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.HYGRAPH_MANAGEMENT_TOKEN}` },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (body.errors?.length) throw new Error(JSON.stringify(body.errors).slice(0, 400));
  return body.data;
}

/** Schema changes are queued; nothing downstream is valid until they land. */
async function settle(migrationId, label) {
  for (let i = 0; i < 40; i += 1) {
    await new Promise((r) => setTimeout(r, 1500));
    const data = await gql(
      `{ viewer { ... on TokenViewer { project { environment(name:"master"){ migrations { id status errors } } } } } }`,
    );
    const m = data.viewer.project.environment.migrations.find((x) => x.id === migrationId);
    if (m && !["QUEUED", "IN_PROGRESS", "RUNNING", "PENDING"].includes(m.status)) {
      if (m.status !== "SUCCESS") throw new Error(`${label}: ${m.status} ${JSON.stringify(m.errors)}`);
      return;
    }
  }
  throw new Error(`${label}: timed out`);
}

async function model() {
  const d = await gql(
    `{ viewer { ... on TokenViewer { project { environment(name:"master"){ id contentModel { models { id apiId fields { apiId } } } } } } } }`,
  );
  return d.viewer.project.environment;
}

let envInfo = await model();
let shopSection = envInfo.contentModel.models.find((m) => m.apiId === "ShopSection");

if (!shopSection) {
  const r = await gql(
    `mutation M($data: CreateModelInput!){ createModel(data:$data){ migration { id } } }`,
    { data: { environmentId: envInfo.id, apiId: "ShopSection", apiIdPlural: "ShopSections",
              displayName: "Shop section", description: "One row per storefront section. Hide, reorder and rewrite the shop without a deploy." } },
  );
  await settle(r.createModel.migration.id, "createModel ShopSection");
  envInfo = await model();
  shopSection = envInfo.contentModel.models.find((m) => m.apiId === "ShopSection");
  console.log("created model ShopSection");
} else {
  console.log("model ShopSection already exists");
}

const have = new Set(shopSection.fields.map((f) => f.apiId));

const SIMPLE = [
  ["sectionKey", "STRING", "Section key", "Which section this controls: hero, featured, categories, values or story.", { isRequired: true, isTitle: true }],
  ["isVisible", "BOOLEAN", "Visible", "Untick to remove this section from the storefront.", { initialValue: "true" }],
  ["sortOrder", "INT", "Display order", "Lower numbers appear first.", {}],
  ["eyebrowEn", "STRING", "Eyebrow (EN)", "Small label above the heading. Leave blank for none.", {}],
  ["eyebrowEs", "STRING", "Eyebrow (ES)", "", {}],
  ["headingEn", "STRING", "Heading (EN)", "", {}],
  ["headingEs", "STRING", "Heading (ES)", "", {}],
  ["bodyEn", "STRING", "Body (EN)", "", {}],
  ["bodyEs", "STRING", "Body (ES)", "", {}],
  ["ctaLabelEn", "STRING", "Button label (EN)", "", {}],
  ["ctaLabelEs", "STRING", "Button label (ES)", "", {}],
  ["ctaUrl", "STRING", "Button link", "", {}],
  ["itemLimit", "INT", "How many products", "Only used by the featured section.", {}],
];

for (const [apiId, type, displayName, description, extra] of SIMPLE) {
  if (have.has(apiId)) { console.log(`  field ${apiId} exists`); continue; }
  const r = await gql(
    `mutation F($data: CreateSimpleFieldInput!){ createSimpleField(data:$data){ migration { id } } }`,
    { data: { modelId: shopSection.id, apiId, type, displayName, description,
              isRequired: false, isUnique: false, isList: false, isLocalized: false,
              isHidden: false, ...extra } },
  );
  await settle(r.createSimpleField.migration.id, `field ${apiId}`);
  console.log(`  + ${apiId}`);
}

if (!have.has("image")) {
  const r = await gql(
    `mutation F($data: CreateRelationalFieldInput!){ createRelationalField(data:$data){ migration { id } } }`,
    { data: { modelId: shopSection.id, apiId: "image", displayName: "Section photo", type: "ASSET",
              isList: false, isRequired: false, description: "Background or side photo for this section.",
              reverseSide: { modelId: ASSET_MODEL_ID,
                             field: { apiId: "shopSectionsUsingPhoto", displayName: "Shop sections using this photo", isList: true } } } },
  );
  await settle(r.createRelationalField.migration.id, "field image");
  console.log("  + image");
} else {
  console.log("  field image exists");
}

console.log("\nShopSection ready.");
