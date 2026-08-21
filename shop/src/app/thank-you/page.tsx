import Link from "next/link";
import { getStripe } from "@/lib/stripe";

type ThankYouPageProps = {
  searchParams: Promise<{ session_id?: string }>;
};

function formatAmount(amountInCents: number | null): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format((amountInCents ?? 0) / 100);
}

export default async function ThankYouPage({ searchParams }: ThankYouPageProps) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    return (
      <main className="min-h-screen bg-sand px-6 py-16 text-ink">
        <div className="mx-auto max-w-xl">
          <p className="text-xs uppercase tracking-[0.25em] text-gold">KHLA / Shop</p>
          <h1 className="mt-8 font-display text-5xl">No checkout session found.</h1>
          <Link href="/" className="mt-8 inline-block text-sm underline underline-offset-4">
            Return to the shop
          </Link>
        </div>
      </main>
    );
  }

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const isPaid = session.payment_status === "paid";
  const email = session.customer_details?.email ?? session.customer_email ?? "Not provided";

  return (
    <main className="min-h-screen bg-sand px-6 py-16 text-ink sm:px-10">
      <div className="mx-auto max-w-xl">
        <p className="text-xs uppercase tracking-[0.25em] text-gold">KHLA / Thank you</p>
        <h1 className="mt-8 font-display text-5xl leading-none">
          {isPaid ? "The light is moving forward." : "Your checkout is underway."}
        </h1>
        <p className="mt-6 text-base leading-7 text-ink/65">
          {isPaid
            ? "Thank you for supporting Keep Her Light Alive Foundation, Inc."
            : "Payment is still processing. We will not mark this order as successful until Stripe confirms payment."}
        </p>

        <dl className="mt-12 divide-y divide-ink/15 border-y border-ink/15 text-sm">
          <div className="flex justify-between gap-6 py-4">
            <dt className="text-ink/55">Order total</dt>
            <dd className="font-semibold">{formatAmount(session.amount_total)}</dd>
          </div>
          <div className="flex justify-between gap-6 py-4">
            <dt className="text-ink/55">Email</dt>
            <dd className="max-w-[65%] break-words text-right">{email}</dd>
          </div>
          <div className="flex justify-between gap-6 py-4">
            <dt className="text-ink/55">Payment status</dt>
            <dd className="capitalize">{session.payment_status.replaceAll("_", " ")}</dd>
          </div>
        </dl>

        <p className="mt-10 border-l-2 border-gold pl-5 text-sm leading-6 text-ink/65">
          Thank you for your purchase supporting Keep Her Light Alive Foundation, Inc. This
          transaction is a purchase of merchandise, not a charitable contribution, and is not
          tax-deductible. Keep Her Light Alive Foundation, Inc. is a 501(c)(3) tax-exempt
          organization; our EIN is [XX-XXXXXXX].
        </p>

        <Link href="/" className="mt-10 inline-block text-sm font-semibold underline underline-offset-4">
          Return to the shop
        </Link>
      </div>
    </main>
  );
}
