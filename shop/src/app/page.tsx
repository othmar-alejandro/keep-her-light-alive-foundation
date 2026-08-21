import Link from "next/link";
import { tee } from "@/lib/catalog";

type ShopPageProps = {
  searchParams: Promise<{ canceled?: string; lang?: string }>;
};

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const { canceled, lang } = await searchParams;
  const checkoutAction = `/shop/api/checkout${lang === "es" ? "?lang=es" : ""}`;

  return (
    <main className="min-h-screen bg-sand px-6 py-8 text-ink sm:px-10 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-5xl flex-col justify-between">
        <header className="flex items-center justify-between border-b border-ink/15 pb-5 text-xs uppercase tracking-[0.2em]">
          <Link href="/" className="font-semibold tracking-[0.25em]">
            KHLA / Shop
          </Link>
          <span className="text-ink/55">One light at a time</span>
        </header>

        <section className="grid gap-12 py-16 md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-20 md:py-24">
          <div className="relative flex aspect-[4/5] items-center justify-center overflow-hidden bg-ink p-8 shadow-[18px_18px_0_#D4AF37] sm:p-12">
            <div className="absolute inset-7 border border-gold/40" />
            <div className="relative text-center text-sand">
              <p className="mb-5 text-[10px] uppercase tracking-[0.35em] text-gold">
                Keep Her Light Alive
              </p>
              <div className="font-display text-7xl leading-[0.82] sm:text-8xl">
                KH
                <br />
                LA
              </div>
              <p className="mt-7 text-xs uppercase tracking-[0.28em] text-sand/70">
                Foundation tee / navy
              </p>
            </div>
          </div>

          <div className="max-w-md">
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.25em] text-gold">
              The first edition
            </p>
            <h1 className="font-display text-5xl leading-[0.98] sm:text-6xl">
              Wear the light forward.
            </h1>
            <p className="mt-7 max-w-sm text-base leading-7 text-ink/65">
              {tee.title}. Every purchase helps Keep Her Light Alive Foundation,
              Inc. continue its work.
            </p>
            <div className="mt-9 flex items-baseline gap-4">
              <span className="font-display text-3xl">$28.00</span>
              <span className="text-xs uppercase tracking-[0.18em] text-ink/45">
                {tee.sku}
              </span>
            </div>

            {canceled === "1" && (
              <p className="mt-6 border-l-2 border-gold pl-4 text-sm text-ink/70">
                Checkout was canceled. Your tee is still here when you&apos;re ready.
              </p>
            )}

            <form method="post" action={checkoutAction} className="mt-9">
              <button
                type="submit"
                className="w-full bg-ink px-6 py-4 text-sm font-semibold text-sand transition hover:bg-gold hover:text-ink focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-4 focus:ring-offset-sand"
              >
                Buy with Apple Pay / card
              </button>
            </form>
            <p className="mt-4 text-center text-xs leading-5 text-ink/45">
              Secure hosted checkout by Stripe · Apple Pay, Google Pay, Link, or card
            </p>
          </div>
        </section>

        <footer className="border-t border-ink/15 pt-5 text-xs text-ink/50">
          <span>Keep Her Light Alive Foundation, Inc.</span>
          <span className="float-right">{tee.unitAmount / 100} / 1 SKU</span>
        </footer>
      </div>
    </main>
  );
}
