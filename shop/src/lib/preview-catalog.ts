export const previewBasePath = "/shop";

export type Locale = "en" | "es";

type LocalizedText = Record<Locale, string>;

/**
 * The one SKU rule. The cart, the CMS reader and the checkout route all have
 * to agree, or a SKU can be added and then silently dropped on the next read.
 */
export const SKU_PATTERN = /^[A-Z0-9-]{1,40}$/;

/** Shipping policy. Single source of truth — the checkout route reads these too. */
export const FREE_SHIPPING_THRESHOLD_CENTS = 3500;
export const FLAT_SHIPPING_CENTS = 500;

export type PreviewImage = {
  file: string;
  alt: LocalizedText;
};

export type PreviewVariant = {
  sku: string;
  optionValue: string;
  /** Spanish label for non-numeric options (colors). Sizes are the same in both locales. */
  optionValueEs?: string;
  // Trusted price in cents from the published CMS entry; absent on preview data.
  unitAmount?: number;
};

/** Store sections, in display order. */
export const CATEGORIES = ["tees", "fishing", "bags", "drinkware"] as const;
export type Category = (typeof CATEGORIES)[number];

export type OptionKind = "size" | "color" | "option";

export type PreviewProduct = {
  slug: string;
  category: Category;
  /** What the variant selector is choosing. Defaults to size. */
  optionKind?: OptionKind;
  title: LocalizedText;
  description?: LocalizedText;
  priceCents: number;
  /** True when variants are not all the same price, so priceCents is a "from". */
  priceVaries?: boolean;
  images: PreviewImage[];
  variants: PreviewVariant[];
};

const SIZES = ["S", "M", "L", "XL", "2XL", "3XL"] as const;

/** Size variants share one shape across every garment. */
function sizeVariants(skuPrefix: string): PreviewVariant[] {
  return SIZES.map((size) => ({ sku: `${skuPrefix}-${size}`, optionValue: size }));
}

export const previewCatalog: PreviewProduct[] = [
  /* ---------------------------------------------------------------- T-shirts */
  {
    slug: "sweat-and-sunsets-tee",
    category: "tees",
    title: { en: "Sweat & Sunsets Tee", es: "Camiseta Sweat & Sunsets" },
    description: {
      en: "Sage green cotton tee. Small sunrise on the left chest, arched 'Sweat & Sunsets' sunrise on the back.",
      es: "Camiseta de algodón verde salvia. Amanecer pequeño en el pecho y amanecer 'Sweat & Sunsets' en arco en la espalda.",
    },
    priceCents: 3200,
    images: [
      {
        file: "sweat-sunsets-front.jpg",
        alt: {
          en: "Front of the sage green tee with a small gold sunrise on the left chest",
          es: "Frente de la camiseta verde salvia con un pequeño amanecer dorado en el pecho",
        },
      },
      {
        file: "sweat-sunsets-back.jpg",
        alt: {
          en: "Back of the sage green tee with 'Sweat & Sunsets' arched above a line-art sunrise",
          es: "Espalda de la camiseta verde salvia con 'Sweat & Sunsets' en arco sobre un amanecer lineal",
        },
      },
    ],
    variants: sizeVariants("KHLA-TEE-SWS"),
  },
  {
    slug: "meet-me-at-sunset-tee",
    category: "tees",
    title: { en: "Meet Me At Sunset Tee", es: "Camiseta Meet Me At Sunset" },
    description: {
      en: "Sand cotton tee. Small sunrise on the left chest, script 'meet me at sunset' on the back.",
      es: "Camiseta de algodón color arena. Amanecer pequeño en el pecho y 'meet me at sunset' en cursiva en la espalda.",
    },
    priceCents: 3200,
    images: [
      {
        file: "meet-me-at-sunset-front.jpg",
        alt: {
          en: "Front of the sand tee with a small gold sunrise on the left chest",
          es: "Frente de la camiseta color arena con un pequeño amanecer dorado en el pecho",
        },
      },
      {
        file: "meet-me-at-sunset-back.jpg",
        alt: {
          en: "Back of the sand tee with 'meet me at sunset' in script above a line-art sunrise",
          es: "Espalda de la camiseta color arena con 'meet me at sunset' en cursiva sobre un amanecer lineal",
        },
      },
    ],
    variants: sizeVariants("KHLA-TEE-MMS"),
  },
  {
    slug: "butterfly-soul-tee",
    category: "tees",
    title: { en: "Butterfly Soul Tee", es: "Camiseta Butterfly Soul" },
    description: {
      en: "Cotton tee with a small sunrise on the left chest and a gold 'Butterfly Soul' butterfly on the back.",
      es: "Camiseta de algodón con un amanecer pequeño en el pecho y una mariposa dorada 'Butterfly Soul' en la espalda.",
    },
    priceCents: 3200,
    images: [
      {
        file: "butterfly-soul-front.jpg",
        alt: {
          en: "Front of the navy tee with a small gold sunrise on the left chest",
          es: "Frente de la camiseta azul marino con un pequeño amanecer dorado en el pecho",
        },
      },
      {
        file: "butterfly-soul-back.jpg",
        alt: {
          en: "Back of the black tee with a gold butterfly beneath the words 'Butterfly Soul'",
          es: "Espalda de la camiseta negra con una mariposa dorada bajo las palabras 'Butterfly Soul'",
        },
      },
    ],
    variants: sizeVariants("KHLA-TEE-BFS"),
  },
  {
    slug: "do-it-for-her-tee",
    category: "tees",
    title: { en: "Do It For Her Tee", es: "Camiseta Do It For Her" },
    description: {
      en: "White cotton tee with 'Do it for HER' across the chest and a small gold sunrise.",
      es: "Camiseta de algodón blanca con 'Do it for HER' en el pecho y un pequeño amanecer dorado.",
    },
    priceCents: 3000,
    images: [
      {
        file: "do-it-for-her-front.jpg",
        alt: {
          en: "White tee with 'Do it for HER' in script and a small gold sunrise",
          es: "Camiseta blanca con 'Do it for HER' en cursiva y un pequeño amanecer dorado",
        },
      },
    ],
    variants: sizeVariants("KHLA-TEE-DIFH"),
  },

  /* ----------------------------------------------------------------- Fishing */
  {
    slug: "sunrise-performance-sun-shirt",
    category: "fishing",
    title: {
      en: "Sunrise Performance Sun Shirt",
      es: "Camisa Solar de Rendimiento Amanecer",
    },
    description: {
      en: "Long-sleeve performance sun shirt with the full-color sunrise and tarpon back print. Ten colorways; stocked colors to be confirmed.",
      es: "Camisa solar de manga larga con el estampado a todo color del amanecer y el sábalo en la espalda. Diez colores; los colores en inventario están por confirmar.",
    },
    priceCents: 4500,
    images: [
      {
        file: "sun-shirt-back.jpg",
        alt: {
          en: "Back of the white long-sleeve sun shirt with the sunrise, tarpon and dive-flag print",
          es: "Espalda de la camisa solar blanca de manga larga con el amanecer, el sábalo y la bandera de buceo",
        },
      },
      {
        file: "sun-shirt-colorways.jpg",
        alt: {
          en: "The sun shirt shown in ten colorways",
          es: "La camisa solar en diez colores",
        },
      },
    ],
    variants: sizeVariants("KHLA-SUN"),
  },

  /* -------------------------------------------------------------------- Bags */
  {
    slug: "sunrise-tote-bag",
    optionKind: "option",
    category: "bags",
    title: { en: "Sunrise Tote Bag", es: "Bolsa Tote Amanecer" },
    description: {
      en: "Black canvas tote with the gold line-art sunrise.",
      es: "Bolsa tote de lona negra con el amanecer dorado en línea.",
    },
    priceCents: 2800,
    images: [
      {
        file: "tote-bag.jpg",
        alt: {
          en: "Black canvas tote bag with a gold sunrise printed low on the front",
          es: "Bolsa tote de lona negra con un amanecer dorado estampado abajo al frente",
        },
      },
    ],
    variants: [{ sku: "KHLA-BAG-TOTE-OS", optionValue: "One size", optionValueEs: "Talla única" }],
  },
  {
    slug: "pocket-tote",
    optionKind: "option",
    category: "bags",
    title: { en: "Pocket Tote", es: "Tote con Bolsillos" },
    description: {
      en: "Black canvas tote with front pockets and the gold sunrise.",
      es: "Tote de lona negra con bolsillos frontales y el amanecer dorado.",
    },
    priceCents: 3200,
    images: [
      {
        file: "pocket-tote.jpg",
        alt: {
          en: "Black canvas tote with divided front pockets and a gold sunrise",
          es: "Tote de lona negra con bolsillos frontales divididos y un amanecer dorado",
        },
      },
    ],
    variants: [{ sku: "KHLA-BAG-PKT-OS", optionValue: "One size", optionValueEs: "Talla única" }],
  },
  {
    slug: "crossbody-bag",
    optionKind: "option",
    category: "bags",
    title: { en: "Crossbody Bag", es: "Bolso Cruzado" },
    description: {
      en: "Small zip crossbody in black canvas with a rope strap and the gold sunrise.",
      es: "Bolso cruzado pequeño con cremallera, de lona negra con correa de cuerda y el amanecer dorado.",
    },
    priceCents: 2600,
    images: [
      {
        file: "crossbody-bag.jpg",
        alt: {
          en: "Black canvas crossbody bag with a rope strap and a gold sunrise",
          es: "Bolso cruzado de lona negra con correa de cuerda y un amanecer dorado",
        },
      },
    ],
    variants: [{ sku: "KHLA-BAG-XBODY-OS", optionValue: "One size", optionValueEs: "Talla única" }],
  },
  {
    slug: "zip-pouch",
    optionKind: "color",
    category: "bags",
    title: { en: "Zip Pouch", es: "Estuche con Cremallera" },
    description: {
      en: "Canvas wristlet pouch with the gold sunrise. Black or natural.",
      es: "Estuche de lona con asa de muñeca y el amanecer dorado. Negro o natural.",
    },
    priceCents: 1800,
    images: [
      {
        file: "zip-pouch.jpg",
        alt: {
          en: "Canvas zip pouches with wrist straps, shown in black and natural",
          es: "Estuches de lona con cremallera y asa de muñeca, en negro y natural",
        },
      },
    ],
    variants: [
      { sku: "KHLA-BAG-POUCH-BLK", optionValue: "Black", optionValueEs: "Negro" },
      { sku: "KHLA-BAG-POUCH-NAT", optionValue: "Natural", optionValueEs: "Natural" },
    ],
  },

  /* --------------------------------------------------------------- Drinkware */
  {
    slug: "stemless-tumbler",
    optionKind: "color",
    category: "drinkware",
    title: { en: "Stemless Tumbler", es: "Vaso sin Tallo" },
    description: {
      en: "Insulated stemless tumbler with a sliding lid and the sunrise mark. Black or white.",
      es: "Vaso térmico sin tallo con tapa deslizante y la marca del amanecer. Negro o blanco.",
    },
    priceCents: 2400,
    images: [
      {
        file: "stemless-tumbler-black.jpg",
        alt: {
          en: "Black insulated stemless tumbler with a gold sunrise",
          es: "Vaso térmico sin tallo negro con un amanecer dorado",
        },
      },
      {
        file: "stemless-tumbler-white.jpg",
        alt: {
          en: "White insulated stemless tumbler with a yellow sunrise",
          es: "Vaso térmico sin tallo blanco con un amanecer amarillo",
        },
      },
    ],
    variants: [
      { sku: "KHLA-CUP-STEM-BLK", optionValue: "Black", optionValueEs: "Negro" },
      { sku: "KHLA-CUP-STEM-WHT", optionValue: "White", optionValueEs: "Blanco" },
    ],
  },
  {
    slug: "glass-can",
    optionKind: "option",
    category: "drinkware",
    title: { en: "Glass Can & Straw", es: "Vaso de Vidrio con Pajilla" },
    description: {
      en: "Can-shaped glass tumbler with a lid and glass straw.",
      es: "Vaso de vidrio en forma de lata con tapa y pajilla de vidrio.",
    },
    priceCents: 2200,
    images: [
      {
        file: "glass-can.jpg",
        alt: {
          en: "Clear glass can tumbler with a lid, glass straw and a yellow sunrise",
          es: "Vaso de vidrio transparente con tapa, pajilla de vidrio y un amanecer amarillo",
        },
      },
    ],
    variants: [{ sku: "KHLA-CUP-GLASS-OS", optionValue: "One size", optionValueEs: "Talla única" }],
  },
  {
    slug: "skinny-tumbler",
    optionKind: "option",
    category: "drinkware",
    title: { en: "Skinny Tumbler", es: "Vaso Alto" },
    description: {
      en: "Tall insulated tumbler with a stainless straw.",
      es: "Vaso térmico alto con pajilla de acero inoxidable.",
    },
    priceCents: 2600,
    images: [
      {
        file: "skinny-tumbler.jpg",
        alt: {
          en: "Tall white insulated tumbler with a stainless straw and a yellow sunrise",
          es: "Vaso térmico alto blanco con pajilla de acero y un amanecer amarillo",
        },
      },
    ],
    variants: [{ sku: "KHLA-CUP-SKINNY-OS", optionValue: "One size", optionValueEs: "Talla única" }],
  },
  {
    slug: "tumbler-40oz",
    optionKind: "color",
    category: "drinkware",
    title: { en: "40 oz Handle Tumbler", es: "Vaso de 40 oz con Asa" },
    description: {
      en: "Large insulated tumbler with a handle and straw.",
      es: "Vaso térmico grande con asa y pajilla.",
    },
    priceCents: 3800,
    images: [
      {
        file: "tumbler-40oz-pink.jpg",
        alt: {
          en: "Large pink insulated tumbler with a handle, straw and an orange sunrise",
          es: "Vaso térmico grande rosado con asa, pajilla y un amanecer naranja",
        },
      },
    ],
    variants: [{ sku: "KHLA-CUP-40OZ-PNK", optionValue: "Pink", optionValueEs: "Rosado" }],
  },
  {
    slug: "travel-mug",
    optionKind: "color",
    category: "drinkware",
    title: { en: "Travel Mug", es: "Taza de Viaje" },
    description: {
      en: "Insulated travel mug with a handle and flip lid.",
      es: "Taza de viaje térmica con asa y tapa abatible.",
    },
    priceCents: 3200,
    images: [
      {
        file: "travel-mug-pink.jpg",
        alt: {
          en: "Pink insulated travel mug with a handle, flip lid and an orange sunrise",
          es: "Taza de viaje térmica rosada con asa, tapa abatible y un amanecer naranja",
        },
      },
    ],
    variants: [{ sku: "KHLA-CUP-MUG-PNK", optionValue: "Pink", optionValueEs: "Rosado" }],
  },
];

/** Groups products into the store's sections, dropping empty ones. */
export function groupByCategory(
  products: PreviewProduct[],
): { category: Category; products: PreviewProduct[] }[] {
  return CATEGORIES.map((category) => ({
    category,
    products: products.filter((product) => product.category === category),
  })).filter((group) => group.products.length > 0);
}

/**
 * A featured row should look like the whole store, so take one product from
 * each section in turn rather than the first N of the catalog.
 */
export function featuredProducts(products: PreviewProduct[], limit: number): PreviewProduct[] {
  const byCategory = CATEGORIES.map((category) =>
    products.filter((product) => product.category === category),
  );
  const picked: PreviewProduct[] = [];
  for (let round = 0; picked.length < limit; round += 1) {
    const before = picked.length;
    for (const group of byCategory) {
      if (group[round] && picked.length < limit) picked.push(group[round]);
    }
    if (picked.length === before) break;
  }
  return picked;
}

export function variantLabel(variant: PreviewVariant, locale: Locale): string {
  return locale === "es" && variant.optionValueEs ? variant.optionValueEs : variant.optionValue;
}

/**
 * Where the foundation site lives. basePath is /shop, so these links must
 * bypass next/link. On a single origin the default "/" is right; set
 * NEXT_PUBLIC_FOUNDATION_URL when the shop is deployed somewhere else.
 */
const FOUNDATION_ORIGIN = (process.env.NEXT_PUBLIC_FOUNDATION_URL || "/").replace(/\/$/, "");

export function foundationUrl(path = "/"): string {
  // A rooted path only. "//host", "https://host" and "\\host" would otherwise
  // concatenate into a link that leaves the site, which a CMS field must never do.
  const safe = /^\/(?![/\\])/.test(path) ? path : "/";
  return `${FOUNDATION_ORIGIN}${safe}` || "/";
}

export function assetUrl(file: string): string {
  if (file.startsWith("https://")) return file;
  return `${previewBasePath}/shop/${file}`;
}

export function catalogHref(locale: Locale): string {
  return locale === "es" ? "/?lang=es" : "/";
}

export function productHref(slug: string, locale: Locale): string {
  return `/p/${slug}${locale === "es" ? "?lang=es" : ""}`;
}

/** The full grid lives on its own page; sections within it are anchors. */
export function allHref(locale: Locale): string {
  return locale === "es" ? "/all?lang=es" : "/all";
}

export function sectionHref(category: Category, locale: Locale): string {
  return `${allHref(locale)}#${category}`;
}

export function formatPrice(cents: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "es" ? "es-US" : "en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

/**
 * Everything the cart drawer needs to draw a line, keyed by SKU. Built on the
 * server from the published catalog so the drawer never has to re-fetch and
 * never invents a price of its own.
 */
export function buildBagIndex(products: PreviewProduct[], locale: Locale) {
  const index: Record<string, BagEntry> = {};
  for (const product of products) {
    for (const variant of product.variants) {
      // First match wins, the same way the checkout route resolves a SKU. If
      // two products ever share one, the cart and the charge agree on which.
      if (index[variant.sku]) continue;
      index[variant.sku] = {
        sku: variant.sku,
        slug: product.slug,
        title: product.title[locale],
        optionValue: variantLabel(variant, locale),
        unitAmount: variant.unitAmount ?? product.priceCents,
        image: product.images[0].file,
        alt: product.images[0].alt[locale],
      };
    }
  }
  return index;
}

type BagEntry = {
  sku: string;
  slug: string;
  title: string;
  optionValue: string;
  unitAmount: number;
  image: string;
  alt: string;
};

export const previewCopy = {
  en: {
    skipToContent: "Skip to catalog",
    skipToProduct: "Skip to product",
    noticeLabel: "Preview",
    notice:
      "Photos are supplier mockups and prices are placeholders. Checkout is not connected yet.",
    brand: "KHLA / Shop",
    languageLabel: "Language",
    h1: "Shop",
    catalogReady: "Published products will appear here after the editor adds them.",
    catalogError: "The catalog is temporarily unavailable. Please try again later.",
    provisional: "Provisional price",
    breadcrumbLabel: "Breadcrumb",
    category: {
      tees: "T-Shirts",
      fishing: "Fishing Shirts",
      bags: "Bags",
      drinkware: "Drinkware",
    },
    freeShipping: "Free shipping on orders over $35",
    galleryLabel: "Product images",
    optionLabel: { size: "Size", color: "Color", option: "Option" },
    subtotal: "Subtotal",
    refresh: "Refresh status",
    back: "Back to the shop",
    /* Reused verbatim from the live homepage's shop section so the two read as
       one voice; the Spanish is the Foundation's own, not a translation. */
    heroImageAlt: "Friends on a boat at sunrise in South Florida, wearing the collection",
    heroEyebrow: "The Shop",
    notFoundTitle: "We can't find that page.",
    notFoundBody: "The link may be old, or the product may have been taken down.",
    errorTitle: "Something went wrong.",
    errorBody: "The shop had a problem loading. Try again in a moment.",
    tryAgain: "Try again",
    priceFrom: "From",
    allProducts: "All products",
    heroTitleLead: "Wear her",
    heroTitleAccent: "light.",
    heroBodyShort:
      "Every piece carries Stephanie's sunrise, and funds water-safety education in South Florida.",
    heroCta: "Shop the collection",
    heroSecondary: "Our mission",
    shopCount: "Shop {n} \u2192",
    /* Section headings read as sentences, the way every Shopify reference
       theme writes them — "Glowing skin, naturally", not "Featured". */
    featuredHeading: "Every piece starts with her sunrise.",
    categoryHeading: "Four ways to carry it.",
    valueHeading: "How it works",
    values: [
      { title: "Ships from Miami", body: "Orders go out in 3-5 business days once the store opens." },
      { title: "Free over $35", body: "Flat $5 shipping in the United States, free above $35." },
      { title: "Every order funds the work", body: "Proceeds support water-safety education in South Florida." },
      { title: "Not a donation", body: "Merchandise isn't tax-deductible. Donations are, and are receipted separately." },
    ],
    featured: "Featured",
    viewAll: "View all {n} products",
    storyEyebrow: "Her story",
    storyPortraitAlt: "Stephanie Marie Rodriguez in the water, smiling",
    storyHeading: "Why we make these",
    storyBody:
      "Stephanie loved the water. The Foundation her family built teaches South Florida families how to come home from it: life jackets, swim lessons, boating safety. Every order pays for that work.",
    storyLink: "Read her story",
    heroBody:
      "Apparel, bags and drinkware made by Stephanie's family and friends. Every piece funds water-safety education in South Florida, and carries the message onto the water.",
    taxNote:
      "A purchase is not a tax-deductible donation. Donations are, and are receipted separately.",
    foundationHome: "Foundation home",
    impact: "Every purchase funds water-safety education in South Florida.",
    cart: "Cart",
    openCart: "Open cart",
    closeCart: "Close cart",
    cartEmpty: "Your cart is empty.",
    cartEmptyHint: "Browse the shop and add something you love.",
    addToCart: "Add to cart",
    addedToCart: "Added to cart",
    chooseOption: { size: "Choose a size", color: "Choose a color", option: "Choose an option" },
    quantity: "Quantity",
    decrease: "Decrease quantity",
    increase: "Increase quantity",
    removeItem: "Remove",
    /** {amount} is substituted with a formatted price. */
    freeShippingProgress: "You're {amount} away from free shipping.",
    freeShippingEarned: "Your order ships free.",
    shipping: "Shipping",
    checkoutSoon: "Checkout opens soon",
    checkoutSoonNote:
      "The Foundation is setting up payments. Your cart is saved on this device until then.",
    itemsInCart: "{n} in cart",
    itemCount: { one: "{n} item", other: "{n} items" },
    relatedHeading: "You may also like",
    detailsHeading: "Product details",
    shippingHeading: "Shipping",
    shippingBody:
      "Flat $5 shipping in the United States, free on orders over $35. Orders ship from South Florida once the store opens.",
    toBeConfirmed: "Materials and sizing are confirmed by the Foundation before the store opens.",
    footer: "Keep Her Light Alive Foundation, Inc. Preview store, not open for orders.",
    footerOpen: "Keep Her Light Alive Foundation, Inc. A Florida 501(c)(3) nonprofit.",
  },
  es: {
    skipToContent: "Saltar al catálogo",
    skipToProduct: "Saltar al producto",
    noticeLabel: "Vista previa",
    notice:
      "Las fotos son maquetas del proveedor y los precios son provisionales. El pago aún no está conectado.",
    brand: "KHLA / Tienda",
    languageLabel: "Idioma",
    h1: "Tienda",
    catalogReady: "Los productos publicados aparecerán aquí cuando el editor los agregue.",
    catalogError: "El catálogo no está disponible por el momento. Inténtalo de nuevo más tarde.",
    provisional: "Precio provisional",
    breadcrumbLabel: "Ruta de navegación",
    category: {
      tees: "Camisetas",
      fishing: "Camisas de Pesca",
      bags: "Bolsos",
      drinkware: "Vasos y Tazas",
    },
    freeShipping: "Envío gratis en compras de más de $35",
    galleryLabel: "Fotos del producto",
    optionLabel: { size: "Talla", color: "Color", option: "Opción" },
    subtotal: "Subtotal",
    refresh: "Actualizar estado",
    back: "Volver a la tienda",
    heroImageAlt: "Amigos en un bote al amanecer en el sur de la Florida, con la colecci\u00f3n",
    heroEyebrow: "La Tienda",
    notFoundTitle: "No encontramos esa p\u00e1gina.",
    notFoundBody: "El enlace puede ser viejo, o el producto ya no est\u00e1 disponible.",
    errorTitle: "Algo sali\u00f3 mal.",
    errorBody: "La tienda tuvo un problema al cargar. Int\u00e9ntalo de nuevo en un momento.",
    tryAgain: "Intentar de nuevo",
    priceFrom: "Desde",
    allProducts: "Todos los productos",
    heroTitleLead: "Lleva su",
    heroTitleAccent: "luz.",
    heroBodyShort:
      "Cada pieza lleva el amanecer de Stephanie y financia educaci\u00f3n sobre seguridad en el agua en el sur de la Florida.",
    heroCta: "Ver la colecci\u00f3n",
    heroSecondary: "Nuestra misi\u00f3n",
    shopCount: "Ver {n} \u2192",
    featuredHeading: "Cada pieza empieza con su amanecer.",
    categoryHeading: "Cuatro maneras de llevarlo.",
    valueHeading: "C\u00f3mo funciona",
    values: [
      { title: "Sale de Miami", body: "Los pedidos salen en 3 a 5 d\u00edas h\u00e1biles cuando abra la tienda." },
      { title: "Gratis desde $35", body: "Env\u00edo de $5 en Estados Unidos, gratis en compras de m\u00e1s de $35." },
      { title: "Cada pedido financia el trabajo", body: "Lo recaudado apoya la educaci\u00f3n sobre seguridad en el agua en el sur de la Florida." },
      { title: "No es una donaci\u00f3n", body: "La mercanc\u00eda no es deducible de impuestos. Las donaciones s\u00ed lo son y se reciben por separado." },
    ],
    featured: "Destacados",
    viewAll: "Ver los {n} productos",
    storyEyebrow: "Su historia",
    storyPortraitAlt: "Stephanie Marie Rodr\u00edguez en el agua, sonriendo",
    storyHeading: "Por qu\u00e9 hacemos esto",
    storyBody:
      "A Stephanie le encantaba el agua. La Fundaci\u00f3n que cre\u00f3 su familia ense\u00f1a a las familias del sur de la Florida a volver a casa desde ella: chalecos salvavidas, clases de nataci\u00f3n, seguridad en bote. Cada pedido paga ese trabajo.",
    storyLink: "Lee su historia",
    heroBody:
      "Ropa, bolsos y vasos hechos por la familia y las amigas de Stephanie. Cada pieza financia educaci\u00f3n sobre seguridad en el agua en el sur de la Florida y lleva el mensaje al agua.",
    taxNote:
      "Una compra no es una donaci\u00f3n deducible de impuestos. Las donaciones s\u00ed lo son y se reciben por separado.",
    foundationHome: "Inicio de la Fundación",
    impact: "Cada compra financia educación sobre seguridad en el agua en el sur de la Florida.",
    cart: "Carrito",
    openCart: "Abrir carrito",
    closeCart: "Cerrar carrito",
    cartEmpty: "Tu carrito está vacío.",
    cartEmptyHint: "Recorre la tienda y agrega algo que te guste.",
    addToCart: "Agregar al carrito",
    addedToCart: "Agregado al carrito",
    chooseOption: { size: "Elige una talla", color: "Elige un color", option: "Elige una opción" },
    quantity: "Cantidad",
    decrease: "Reducir cantidad",
    increase: "Aumentar cantidad",
    removeItem: "Quitar",
    freeShippingProgress: "Te faltan {amount} para el envío gratis.",
    freeShippingEarned: "Tu pedido tiene envío gratis.",
    shipping: "Envío",
    checkoutSoon: "El pago se abre pronto",
    checkoutSoonNote:
      "La Fundación está configurando los pagos. Tu carrito se guarda en este dispositivo mientras tanto.",
    itemsInCart: "{n} en el carrito",
    itemCount: { one: "{n} artículo", other: "{n} artículos" },
    relatedHeading: "También te puede gustar",
    detailsHeading: "Detalles del producto",
    shippingHeading: "Envío",
    shippingBody:
      "Envío de $5 en Estados Unidos, gratis en pedidos de más de $35. Los pedidos salen del sur de la Florida cuando abra la tienda.",
    toBeConfirmed:
      "La Fundación confirma los materiales y las tallas antes de que abra la tienda.",
    footer:
      "Keep Her Light Alive Foundation, Inc. Tienda en vista previa, no abierta para pedidos.",
    footerOpen: "Keep Her Light Alive Foundation, Inc. Organización 501(c)(3) de la Florida.",
  },
} as const;
