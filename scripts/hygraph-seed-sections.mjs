#!/usr/bin/env node
/** Seeds ShopSection with the copy the storefront ships with, so the CMS
 *  starts in sync with the code instead of empty. Idempotent by sectionKey. */
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
  const r = await fetch(env.HYGRAPH_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.HYGRAPH_TOKEN}` },
    body: JSON.stringify({ query, variables }),
  });
  const b = await r.json();
  if (b.errors?.length) throw new Error(JSON.stringify(b.errors).slice(0, 400));
  return b.data;
}

const SECTIONS = [
  { sectionKey: "hero", sortOrder: 1, isVisible: true,
    eyebrowEn: "The Shop", eyebrowEs: "La Tienda",
    headingEn: "Wear her light.", headingEs: "Lleva su luz.",
    bodyEn: "Every piece carries Stephanie's sunrise, and funds water-safety education in South Florida.",
    bodyEs: "Cada pieza lleva el amanecer de Stephanie y financia educación sobre seguridad en el agua en el sur de la Florida.",
    ctaLabelEn: "Shop the collection", ctaLabelEs: "Ver la colección", ctaUrl: "/all" },
  { sectionKey: "featured", sortOrder: 2, isVisible: true, itemLimit: 6,
    headingEn: "Every piece starts with her sunrise.", headingEs: "Cada pieza empieza con su amanecer." },
  { sectionKey: "categories", sortOrder: 3, isVisible: true,
    headingEn: "Four ways to carry it.", headingEs: "Cuatro maneras de llevarlo." },
  { sectionKey: "values", sortOrder: 4, isVisible: true,
    headingEn: "How it works", headingEs: "Cómo funciona" },
  { sectionKey: "story", sortOrder: 5, isVisible: true,
    eyebrowEn: "Her story", eyebrowEs: "Su historia",
    headingEn: "Why we make these", headingEs: "Por qué hacemos esto",
    bodyEn: "Stephanie loved the water. The Foundation her family built teaches South Florida families how to come home from it: life jackets, swim lessons, boating safety. Every order pays for that work.",
    bodyEs: "A Stephanie le encantaba el agua. La Fundación que creó su familia enseña a las familias del sur de la Florida a volver a casa desde ella: chalecos salvavidas, clases de natación, seguridad en bote. Cada pedido paga ese trabajo.",
    ctaLabelEn: "Read her story", ctaLabelEs: "Lee su historia", ctaUrl: "/#legacy" },
];

const existing = await gql(`{ shopSections(stage: DRAFT, first: 100){ id sectionKey } }`);
const bySlug = new Map(existing.shopSections.map((s) => [s.sectionKey, s.id]));

for (const section of SECTIONS) {
  if (bySlug.has(section.sectionKey)) {
    await gql(`mutation U($id: ID!, $data: ShopSectionUpdateInput!){ updateShopSection(where:{id:$id}, data:$data){ id } }`,
      { id: bySlug.get(section.sectionKey), data: section });
  } else {
    await gql(`mutation C($data: ShopSectionCreateInput!){ createShopSection(data:$data){ id } }`, { data: section });
  }
  await gql(`mutation P($key: String!){ publishShopSection(where:{sectionKey:$key}, to: PUBLISHED){ id } }`,
    { key: section.sectionKey }).catch(async () => {
      const all = await gql(`{ shopSections(stage: DRAFT, where:{sectionKey:"${section.sectionKey}"}){ id } }`);
      await gql(`mutation P($id: ID!){ publishShopSection(where:{id:$id}, to: PUBLISHED){ id } }`, { id: all.shopSections[0].id });
    });
  console.log(`  ${section.sectionKey.padEnd(12)} order ${section.sortOrder}  visible ${section.isVisible}`);
}

const live = await gql(`{ shopSections(stage: PUBLISHED, first: 100, orderBy: sortOrder_ASC){ sectionKey isVisible sortOrder headingEn } }`);
console.log(`\npublished sections: ${live.shopSections.length}`);
for (const s of live.shopSections) console.log(`  ${s.sortOrder} ${s.sectionKey.padEnd(12)} ${s.isVisible ? "on " : "OFF"} ${s.headingEn ?? ""}`);
