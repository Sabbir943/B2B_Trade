import Link from "next/link";
import MarketSearch from "./market-search";
import { shell } from "./shell";
import { getSiteContentSection } from "@/lib/site-content";

const DEFAULT_TAGS = ["Spices", "Industrial Chemicals", "Jute Products", "Rice", "Garment Accessories"];

/** Only same-origin paths — blocks CSS/JS payloads in style.url(). */
function safeImageUrl(value, fallback) {
  const raw = String(value || "").trim();
  if (/^\/(?!\/)[^\s'"()\\]*$/.test(raw)) return raw;
  return fallback;
}

export default async function HeroBanner() {
  // Cached site content — the no-code editor's copy, with the shipped
  // defaults as fallback until staff save their first edit.
  const hero = await getSiteContentSection("home.hero");
  const popularTags = hero.popularTags?.length ? hero.popularTags : DEFAULT_TAGS;
  const imageDesktop = safeImageUrl(hero.imageDesktop, "/hero-desktop.webp");
  const imageMobile = safeImageUrl(hero.imageMobile, "/hero-mobile.webp");

  return (
    <section
      className="relative overflow-hidden text-white"
      style={{ backgroundColor: "#10223A" }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 md:hidden"
        style={{
          backgroundImage: `url(${imageMobile})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 hidden md:block"
        style={{
          backgroundImage: `url(${imageDesktop})`,
          backgroundSize: "cover",
          backgroundPosition: "right center",
        }}
      />

      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[#10223A]/45 md:hidden"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 hidden bg-gradient-to-r from-[#10223A] from-25% via-[#10223A]/85 via-55% to-transparent to-80% md:block lg:hidden"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 hidden bg-gradient-to-r from-[#10223A] from-25% via-[#10223A]/65 via-55% to-transparent to-80% lg:block"
      />

      <div className={`relative py-11 sm:py-14 lg:py-20 ${shell}`}>
        <div className="max-w-2xl">
          <span className="block h-[3px] w-10 rounded-full bg-[#F5A524]" />

          <p
            className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] sm:text-[13px]"
            style={{ color: "#F5A524" }}
          >
            {hero.eyebrow}
          </p>

          <h1 className="mt-4 font-display text-[1.75rem] font-bold leading-[1.12] tracking-tight text-white sm:text-[2.3rem] lg:text-[2.9rem] xl:text-[3.25rem]">
            {hero.title}
          </h1>

          <p className="mt-4 max-w-xl text-[15px] leading-7 text-white/85 sm:text-base">
            {hero.subtitle}
          </p>

          <div className="mt-7 hidden md:block">
            <MarketSearch id="hero-search" size="lg" />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
            <span className="font-medium text-white/60">Popular:</span>
            {popularTags.map((tag) => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                className="rounded-full border border-white/25 px-3 py-1 font-medium text-white/90 transition hover:border-white/60 hover:text-white"
              >
                {tag}
              </Link>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/rfq"
              className="rounded-md bg-[#B45309] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#92400E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              I want to Buy
            </Link>
            <Link
              href="/sell"
              className="rounded-md border border-white bg-transparent px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              I want to Sell
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
