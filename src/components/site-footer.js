import Link from "next/link";
import BrandLogo from "./brand-logo";
import { shell } from "./shell";
import { APP_LEGAL_NAME, APP_LOCATION, APP_URL, WHATSAPP_URL } from "@/lib/brand";
import {
  FacebookIcon,
  LinkedInIcon,
  MapPinIcon,
  WhatsAppIcon,
  XIcon,
  YoutubeIcon,
} from "./icons";

const columns = [
  {
    title: "For Buyers",
    links: [
      { label: "Find Suppliers", href: "/suppliers" },
      { label: "Post Requirement", href: "/rfq" },
      { label: "Sourcing Service", href: "/sourcing-service" },
      { label: "Buyer Guide", href: "/buyer-guide" },
      { label: "Supplier Guide", href: "/supplier-guide" },
    ],
  },
  {
    title: "For Suppliers",
    links: [
      { label: "Browse Buy Requirements", href: "/requirements" },
      { label: "List Products", href: "/dashboard/products" },
      { label: "Get Verified", href: "/verification" },
      { label: "Membership Plans", href: "/membership" },
      { label: "Trust & Safety / Report Fraud", href: "/legal/trust-safety" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Sourcing Desk", href: "/sourcing-service" },
      { label: "Bangladesh Market Entry", href: "/market-entry" },
      { label: "Verification Services", href: "/verification" },
      { label: "Advertise", href: "/contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About AlliedOne", href: APP_URL, external: true },
      { label: "Contact", href: "/contact" },
      { label: "Careers", href: "/about" },
      { label: "Partner With Us", href: "/contact" },
    ],
  },
  {
    title: "Legal & Help",
    links: [
      { label: "Terms of Use", href: "/legal/terms" },
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "Product Listing Policy", href: "/legal/product-listing-policy" },
      { label: "Refund Policy", href: "/legal/refund-policy" },
      { label: "Trust & Safety", href: "/legal/trust-safety" },
    ],
  },
];

const socials = [
  { label: "WhatsApp", href: WHATSAPP_URL, Icon: WhatsAppIcon },
  { label: "X", href: "https://x.com", Icon: XIcon },
  { label: "LinkedIn", href: "https://linkedin.com", Icon: LinkedInIcon },
  { label: "Facebook", href: "https://facebook.com", Icon: FacebookIcon },
  { label: "YouTube", href: "https://youtube.com", Icon: YoutubeIcon },
];

const payments = ["VISA", "Mastercard", "Amex", "PayPal", "bKash", "Nagad"];

async function copyrightYear() {
  "use cache";
  return new Date().getFullYear();
}

export default async function SiteFooter() {
  const year = await copyrightYear();
  return (
    <footer className="bg-primary text-white">
      <div className={`grid gap-10 py-12 sm:py-14 lg:grid-cols-12 ${shell}`}>
        <div className="lg:col-span-4">
          <BrandLogo tone="onDark" showTagline />
          <p className="mt-4 max-w-sm text-sm leading-6 text-white/65">
            An international B2B import and export marketplace — connecting
            buyers and suppliers across sourcing, verification, documentation
            and logistics.
          </p>
          <div className="mt-5 flex items-center gap-2 text-[13px] text-white/70">
            <MapPinIcon className="h-4 w-4 text-white/50" />
            {APP_LOCATION}
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-3 lg:col-span-8 lg:grid-cols-5">
          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/60">
                {column.title}
              </p>
              <ul className="mt-3 space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-white/70 transition-colors hover:text-white"
                      {...(link.external ? { target: "_blank", rel: "noreferrer" } : {})}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div
          className={`flex flex-col gap-4 py-5 text-[12px] text-white/60 lg:flex-row lg:items-center lg:justify-between ${shell}`}
        >
          <span className="flex items-center gap-2">
            <MapPinIcon className="h-4 w-4 text-white/40" />
            {APP_LOCATION}
          </span>

          <div className="flex items-center gap-2">
            {socials.map(({ label, href, Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {payments.map((brand) => (
              <span
                key={brand}
                className="rounded-md bg-white/10 px-2 py-1 text-[10px] font-bold tracking-wide text-white/75 ring-1 ring-white/10"
              >
                {brand}
              </span>
            ))}
          </div>

          <p>
            © {year} {APP_LEGAL_NAME}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
