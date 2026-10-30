import type { Metadata } from "next";
import Link from "next/link";
import { catalogHref, formatPrice, type Locale } from "@/lib/preview-catalog";
import { isShopDbConfigured, select } from "@/lib/shop-db";
import { ORDER_ID_PATTERN } from "@/lib/stripe";

// The lookup token in the URL is the buyer's only key to this page.
export const metadata: Metadata = {
  title: "Order status | Keep Her Light Alive Shop",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

type OrderStatus = "pending" | "paid" | "canceled" | "expired" | "payment_review";

type Order = {
  status: OrderStatus;
  subtotal_amount: number;
  shop_order_items: { title: string; quantity: number; unit_amount: number }[];
};

const copy = {
  en: {
    none: {
      title: "Checkout is being prepared.",
      body: "This page does not confirm a payment or an order.",
    },
    pending: {
      title: "We are confirming your payment.",
      body: "This can take a moment. Your order is not confirmed until this page says so.",
    },
    paid: {
      title: "Thank you. Your order is confirmed.",
      body: "Your payment was received.",
    },
    canceled: {
      title: "This checkout was not completed.",
      body: "No order was placed.",
    },
    payment_review: {
      title: "Your payment was received.",
      body: "This order needs a manual review by the Foundation before it is confirmed.",
    },
    refresh: "Check again",
    subtotal: "Merchandise subtotal",
    back: "Return to the shop",
  },
  es: {
    none: {
      title: "El pago está en preparación.",
      body: "Esta página no confirma un pago ni un pedido.",
    },
    pending: {
      title: "Estamos confirmando tu pago.",
      body: "Puede tardar un momento. Tu pedido no está confirmado hasta que esta página lo indique.",
    },
    paid: {
      title: "Gracias. Tu pedido está confirmado.",
      body: "Recibimos tu pago.",
    },
    canceled: {
      title: "Este pago no se completó.",
      body: "No se realizó ningún pedido.",
    },
    payment_review: {
      title: "Recibimos tu pago.",
      body: "La Fundación debe revisar este pedido manualmente antes de confirmarlo.",
    },
    refresh: "Comprobar de nuevo",
    subtotal: "Subtotal de mercancía",
    back: "Volver a la tienda",
  },
} as const;

async function loadOrder(token: string | undefined): Promise<Order | null> {
  if (!token || !ORDER_ID_PATTERN.test(token) || !isShopDbConfigured()) return null;
  try {
    const [order] = await select<Order>(
      "shop_orders",
      new URLSearchParams({
        lookup_token: `eq.${token}`,
        select: "status,subtotal_amount,shop_order_items(title,quantity,unit_amount)",
      }),
    );
    return order ?? null;
  } catch (error) {
    console.error("Order status unavailable:", error);
    return null;
  }
}

export default async function OrderStatusPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; lang?: string }>;
}) {
  const { order: token, lang } = await searchParams;
  const locale: Locale = lang === "es" ? "es" : "en";
  const t = copy[locale];
  const order = await loadOrder(token);
  const state = !order ? "none" : order.status === "expired" ? "canceled" : order.status;
  const message = t[state];

  return (
    <main className="min-h-screen bg-sand px-6 py-16 text-ink">
      <div className="mx-auto max-w-xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-goldInk">KHLA / Shop</p>
        <h1 className="mt-8 font-display text-5xl">{message.title}</h1>
        <p className="mt-6 text-base leading-7 text-ink/65">{message.body}</p>

        {order && (state === "paid" || state === "payment_review") && (
          <div className="mt-8 rounded-2xl bg-white p-5 text-sm leading-6">
            <ul>
              {order.shop_order_items.map((item) => (
                <li key={item.title} className="flex justify-between gap-4">
                  <span>{item.quantity} × {item.title}</span>
                  <span>{formatPrice(item.quantity * item.unit_amount, locale)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex justify-between gap-4 border-t border-ink/10 pt-4 font-semibold">
              <span>{t.subtotal}</span>
              <span>{formatPrice(order.subtotal_amount, locale)}</span>
            </p>
          </div>
        )}

        {state === "pending" && (
          <p className="mt-8">
            {/* Plain link: reloads this page and re-reads the server's order state. */}
            <a
              href={`?order=${token}&lang=${locale}`}
              className="inline-flex rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white"
            >
              {t.refresh}
            </a>
          </p>
        )}

        <Link
          href={catalogHref(locale)}
          className="mt-8 inline-block py-1.5 text-sm underline underline-offset-4"
        >
          {t.back}
        </Link>
      </div>
    </main>
  );
}
