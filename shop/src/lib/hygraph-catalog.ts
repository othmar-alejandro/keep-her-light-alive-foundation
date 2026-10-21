import {
  CATEGORIES,
  previewCatalog,
  SKU_PATTERN,
  type Category,
  type PreviewProduct,
} from "@/lib/preview-catalog";

type CmsVariant = {
  sku: string;
  labelEn: string;
  labelEs: string | null;
  unitAmount: number;
};

type CmsProduct = {
  slug: string;
  titleEn: string;
  titleEs: string | null;
  descriptionEn: string | null;
  descriptionEs: string | null;
  category: string | null;
  sortOrder: number | null;
  storefrontImage: { url: string } | null;
  gallery: { url: string }[] | null;
  variants: CmsVariant[];
};

const query = `query ShopCatalog {
  shopProducts(stage: PUBLISHED, first: 100) {
    slug titleEn titleEs descriptionEn descriptionEs category sortOrder
    storefrontImage { url }
    gallery { url }
    variants { sku labelEn labelEs unitAmount }
  }
}`;

/**
 * One switch for "this is a real shop, not a preview". While it is off the
 * preview banner, the provisional-price chips and the to-be-confirmed notes
 * all stay up, and findSellableVariant refuses to quote a price — so no code
 * path can charge anyone against placeholder data. Set SHOP_OPEN=true only
 * once the Foundation has confirmed prices.
 */
const SHOP_OPEN = process.env.SHOP_OPEN === "true";

export type StorefrontCatalog = {
  products: PreviewProduct[];
  preview: boolean;
  error: boolean;
};

export async function getStorefrontCatalog(): Promise<StorefrontCatalog> {
  const endpoint = process.env.HYGRAPH_ENDPOINT;
  if (!endpoint) {
    return { products: previewCatalog, preview: true, error: false };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.HYGRAPH_TOKEN
          ? { Authorization: `Bearer ${process.env.HYGRAPH_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({ query }),
      cache: "no-store",
    });
    if (!response.ok) throw new Error(`Hygraph HTTP ${response.status}`);
    const result = (await response.json()) as {
      data?: { shopProducts?: CmsProduct[] };
      errors?: unknown[];
    };
    if (result.errors?.length || !Array.isArray(result.data?.shopProducts)) {
      throw new Error("Hygraph catalog query failed");
    }

    const products = result.data.shopProducts
      .sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999))
      .flatMap((item): PreviewProduct[] => {
        // Images come from the CMS when an editor has set them, and fall back
        // to the bundled file for the same slug otherwise, so a half-filled
        // product still renders. Only these two sources are ever trusted.
        const local = previewCatalog.find((p) => p.slug === item.slug);
        // An editor who also puts the storefront image in the gallery would
        // otherwise produce two slides with the same React key.
        const cmsImages = [...new Set(
          [item.storefrontImage?.url, ...(item.gallery ?? []).map((g) => g.url)]
            .filter((url): url is string => Boolean(url) && isTrustedImageUrl(url!)),
        )];
        const image = cmsImages[0] ?? local?.images[0]?.file;
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug || "") ||
            !item.titleEn || !image ||
            !isKnownCategory(item.category)) return [];
        const validVariants = (item.variants || [])
          .filter((variant) =>
            typeof variant.sku === "string" && SKU_PATTERN.test(variant.sku) &&
            typeof variant.labelEn === "string" && variant.labelEn.trim().length > 0 &&
            Number.isSafeInteger(variant.unitAmount) &&
            variant.unitAmount > 0,
          );
        if (!validVariants.length) return [];
        const amounts = validVariants.map((variant) => variant.unitAmount);
        const priceCents = Math.min(...amounts);
        // A 2XL upcharge is normal. The listing has to say "From $32" rather
        // than quote a price the shopper may not be able to buy at.
        const priceVaries = Math.max(...amounts) !== priceCents;
        return [{
          slug: item.slug,
          category: item.category,
          // The CMS has no field for what the options mean, so the store's own
          // catalog decides whether the selector says Size, Color or Option.
          optionKind: local?.optionKind,
          title: { en: item.titleEn, es: item.titleEs || item.titleEn },
          description: {
            en: item.descriptionEn || "",
            es: item.descriptionEs || item.descriptionEn || "",
          },
          priceCents,
          priceVaries,
          images: cmsImages.length
            ? cmsImages.map((file, i) => ({
                file,
                // Authored alt text is paired by position, so it is only safe
                // when the CMS holds exactly the same shots in the same order.
                // Otherwise the product name, which is never wrong.
                alt: (cmsImages.length === local?.images.length
                  ? local.images[i]?.alt
                  : undefined) ?? {
                  en: item.titleEn,
                  es: item.titleEs || item.titleEn,
                },
              }))
            : (local?.images ?? [{ file: image, alt: { en: item.titleEn, es: item.titleEs || item.titleEn } }]),
          variants: validVariants.map((variant) => ({
            sku: variant.sku,
            optionValue: variant.labelEn,
            optionValueEs: variant.labelEs ?? undefined,
            unitAmount: variant.unitAmount,
          })),
        }];
      });
    // Nothing publishable yet (setup in progress): show the built-in catalog
    // rather than an empty store.
    if (products.length === 0) {
      return { products: previewCatalog, preview: true, error: false };
    }
    return { products, preview: !SHOP_OPEN, error: false };
  } catch (error) {
    console.error("Shop catalog unavailable:", error);
    return { products: [], preview: false, error: true };
  }
}

export type SellableVariant = {
  sku: string;
  slug: string;
  title: string;
  unitAmount: number;
};

// The only source of a chargeable price: a variant of a currently published
// product. Preview data and CMS failures never yield a sellable variant.
export async function findSellableVariant(sku: string): Promise<SellableVariant | null> {
  const { products, preview, error } = await getStorefrontCatalog();
  if (preview || error) return null;
  for (const product of products) {
    const variant = product.variants.find((item) => item.sku === sku);
    if (variant?.unitAmount) {
      return {
        sku,
        slug: product.slug,
        title: `${product.title.en} (${variant.optionValue})`,
        unitAmount: variant.unitAmount,
      };
    }
  }
  return null;
}

/** Only the store's own sections are rendered; anything else in the CMS is ignored. */
function isKnownCategory(value: string | null): value is Category {
  return CATEGORIES.includes(value as Category);
}

function isTrustedImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" &&
      (url.hostname === "graphassets.com" || url.hostname.endsWith(".graphassets.com"));
  } catch {
    return false;
  }
}
