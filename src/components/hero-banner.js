import Image from "next/image";
import Link from "next/link";
import MarketSearch from "./market-search";
import { shell } from "./shell";

const popularSearches = [
  "Rice",
  "Hilsa Fish",
  "Jute Products",
  "Spices",
  "Garment Accessories",
];

export default function HeroBanner() {
  return (
    <section className="relative flex min-h-[calc(100svh-121px)] flex-col justify-center overflow-hidden bg-white sm:min-h-[calc(100svh-147px)]">
      <div aria-hidden="true" className="absolute inset-0">
        <Image
          src="/hero-bg.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          quality={72}
          className="object-cover object-center saturate-[0.85]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/92 via-white/82 to-white/60 lg:bg-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-white from-[12%] via-white/92 via-[48%] to-white/0 to-[82%]" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/55 to-transparent" />
      </div>

      <div className={`relative w-full py-14 sm:py-16 lg:py-20 ${shell}`}>
        <span className="block h-[3px] w-10 rounded-full bg-secondary" />

        <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.18em] text-primary sm:text-[13px]">
          Bangladesh&apos;s verified B2B export marketplace
        </p>

        <h1 className="mt-4 max-w-4xl font-display text-[1.7rem] font-bold leading-[1.12] tracking-tight text-primary sm:text-[2.1rem] lg:text-[2.6rem] xl:text-[3.1rem]">
          Source Bangladesh. Trade globally.
        </h1>

        <p className="mt-4 max-w-xl text-[15px] leading-7 text-ink/80 sm:text-base">
          Verified suppliers, export-ready products and trade support — from
          first search to final shipment.
        </p>

        <div className="mt-7 max-w-3xl">
          <MarketSearch id="hero-search" size="lg" />

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px]">
            <span className="font-medium text-slate-500">Popular:</span>
            {popularSearches.map((term) => (
              <Link
                key={term}
                href={`/search?q=${encodeURIComponent(term)}`}
                className="font-medium text-ink transition-colors hover:text-primary hover:underline"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            href="/rfq"
            className="rounded-md bg-accent px-6 py-3 text-sm font-semibold text-accent-ink shadow-sm transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            I want to Buy
          </Link>
          <Link
            href="/sell"
            className="rounded-md border-2 border-primary bg-white px-6 py-3 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            I want to Sell
          </Link>
        </div>
      </div>
    </section>
  );
}
