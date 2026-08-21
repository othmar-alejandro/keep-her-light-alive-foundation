export const catalog = [
  {
    title: "Keep Her Light Alive Tee",
    description: "A navy tee that carries the Foundation's light forward.",
    sku: "KHLA-TEE-NVY-M",
    unitAmount: 2800,
    currency: "usd" as const,
  },
] as const;

export type CatalogProduct = (typeof catalog)[number];

export const tee = catalog[0];
