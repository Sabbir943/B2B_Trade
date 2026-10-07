"use client";

import { useState } from "react";
import Link from "next/link";
import MarketSearch from "./market-search";
import { shell } from "./shell";
import {
  BarsIcon,
  ChevronDownIcon,
  CloseIcon,
  GlobeIcon,
  MenuIcon,
  UserIcon,
} from "./icons";

const categories = [
  "Spices & Seasonings",
  "Chemicals",
  "Construction Raw Materials",
  "Feed Ingredients",
  "Agro Products",
  "Textile & Garment Accessories",
  "Leather & Footwear",
  "Home Textiles",
  "Plastics & Packaging",
  "Pharmaceuticals",
  "Engineering Goods",
  "Jute & Jute Products",
];

const menus = [
  {
    label: "For Buyers",
    items: [
      { label: "Find Suppliers", href: "/suppliers" },
      { label: "Post Requirement", href: "/rfq" },
      {
        label: "Sourcing Service",
        href: "/sourcing-service",
        sub: ["Managed sourcing", "Sample handling", "Factory audit"],
      },
      { label: "Buyer Guide", href: "/buyer-guide" },
    ],
  },
  {
    label: "For Suppliers",
    items: [
      { label: "Browse Buy Requirements", href: "/rfq" },
      {
        label: "List Products",
        href: "/products/new",
        sub: ["Product listing", "Price lists", "Catalogues"],
      },
      { label: "Get Verified", href: "/verification" },
      { label: "Supplier Guide", href: "/supplier-guide" },
    ],
  },
  {
    label: "Resources",
    items: [
      { label: "Trade Insights", href: "/insights" },
      { label: "FAQs", href: "/faq" },
      { label: "Verification Badges", href: "/verification-badges" },
    ],
  },
];

const directLinks = [
  { label: "Bangladesh Market Entry", href: "/market-entry" },
  { label: "Membership", href: "/membership" },
];

function Dropdown({ label, items, wide = false }) {
  return (
    <li className="group relative">
      <button
        type="button"
        aria-haspopup="true"
        className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-ink transition-colors hover:text-primary"
      >
        {label}
        <ChevronDownIcon className="h-3.5 w-3.5 text-slate-400 transition-colors group-hover:text-primary" />
      </button>

      <div className="invisible absolute left-0 top-full z-40 pt-1.5 opacity-0 transition duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <ul
          className={`rounded-lg border border-slate-200 bg-white py-2 shadow-xl ${
            wide ? "w-[720px] p-5" : "w-64"
          }`}
        >
          {items.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                className="block px-4 py-2 text-sm text-ink transition-colors hover:bg-surface hover:text-primary"
              >
                {item.label}
              </Link>
              {item.sub ? (
                <ul className="mb-1 ml-5 border-l border-slate-200 pl-3">
                  {item.sub.map((sub) => (
                    <li key={sub}>
                      <Link
                        href={item.href}
                        className="block py-1.5 text-[13px] text-slate-500 transition-colors hover:text-primary"
                      >
                        {sub}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </li>
  );
}

function MegaCategories() {
  return (
    <li className="group relative">
      <button
        type="button"
        aria-haspopup="true"
        className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-ink transition-colors hover:text-primary"
      >
        <span className="flex flex-col gap-[3px]">
          <span className="block h-[2px] w-3.5 rounded-full bg-secondary" />
          <span className="block h-[2px] w-3.5 rounded-full bg-secondary" />
          <span className="block h-[2px] w-3.5 rounded-full bg-secondary" />
        </span>
        All Categories
        <ChevronDownIcon className="h-3.5 w-3.5 text-slate-400 transition-colors group-hover:text-primary" />
      </button>

      <div className="invisible absolute left-0 top-full z-40 pt-1.5 opacity-0 transition duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div className="w-[720px] rounded-lg border border-slate-200 bg-white p-5 shadow-xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Browse by category
          </p>
          <ul className="grid grid-cols-3 gap-x-6 gap-y-0.5">
            {categories.map((category) => (
              <li key={category}>
                <Link
                  href="/categories"
                  className="block rounded-md px-2 py-1.5 text-sm text-ink transition-colors hover:bg-surface hover:text-primary"
                >
                  {category}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 border-t border-slate-100 pt-3 text-[13px] text-slate-500">
            Can&apos;t find it?{" "}
            <Link
              href="/rfq"
              className="font-semibold text-primary hover:underline"
            >
              Post a buy requirement
            </Link>{" "}
            and let suppliers come to you.
          </p>
        </div>
      </div>
    </li>
  );
}

export default function SiteNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
      <div className="hidden border-b border-slate-200 md:block">
        <div className={`flex h-9 items-center justify-between ${shell}`}>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <GlobeIcon className="h-3.5 w-3.5 text-secondary" />
              English
            </span>
            <span className="text-slate-300" aria-hidden="true">
              |
            </span>
            <span>
              Currency:{" "}
              <span className="font-semibold text-ink">USD</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <Link
              href="/help"
              className="text-slate-600 transition-colors hover:text-primary"
            >
              Help
            </Link>
            <Link
              href="/sign-in"
              className="flex items-center gap-1.5 text-slate-600 transition-colors hover:text-primary"
            >
              <UserIcon className="h-3.5 w-3.5" />
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded-md bg-accent px-3 py-1 font-semibold text-accent-ink transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Join Free
            </Link>
          </div>
        </div>
      </div>

      <div className={`flex h-14 items-center gap-3 md:h-16 ${shell}`}>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-slate-300 text-ink transition-colors hover:bg-surface md:hidden"
        >
          {menuOpen ? (
            <CloseIcon className="h-5 w-5" />
          ) : (
            <MenuIcon className="h-5 w-5" />
          )}
        </button>

        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-white">
            <BarsIcon className="h-5 w-5" />
          </span>
          <span className="leading-none">
            <span className="block font-display text-[19px] font-bold tracking-tight text-ink">
              TradeBridge
            </span>
            <span className="mt-0.5 block text-[9px] font-semibold uppercase tracking-[0.3em] text-primary">
              Bangladesh
            </span>
          </span>
        </Link>

        <MarketSearch
          id="header-search"
          className="hidden min-w-0 max-w-[680px] flex-1 md:flex"
        />

        <Link
          href="/rfq"
          className="ml-auto shrink-0 rounded-md bg-accent px-3 py-2.5 text-[13px] font-semibold text-accent-ink transition hover:brightness-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-4 sm:text-sm md:ml-0"
        >
          <span className="sm:hidden">Post Requirement</span>
          <span className="hidden sm:inline">Post Your Requirement</span>
        </Link>
      </div>

      <div className="border-t border-slate-200 md:hidden">
        <div className={`py-2 ${shell}`}>
          <MarketSearch id="mobile-search" />
        </div>
      </div>

      <div className="hidden border-t border-slate-200 md:block">
        <nav aria-label="Primary" className={shell}>
          <ul className="flex h-11 items-center gap-1">
            <MegaCategories />
            {menus.slice(0, 2).map((menu) => (
              <Dropdown key={menu.label} label={menu.label} items={menu.items} />
            ))}
            {directLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-md px-3 py-2 text-sm font-medium text-ink transition-colors hover:text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {menus.slice(2).map((menu) => (
              <Dropdown key={menu.label} label={menu.label} items={menu.items} />
            ))}
          </ul>
        </nav>
      </div>

      <div
        id="mobile-menu"
        className={`grid overflow-hidden border-t border-slate-200 transition-[grid-template-rows] duration-300 ease-out md:hidden ${
          menuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 bg-white">
          <div className={`space-y-5 py-4 ${shell}`}>
            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Browse
              </p>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/categories"
                    onClick={() => setMenuOpen(false)}
                    className="block py-1.5 text-sm font-medium text-ink hover:text-primary"
                  >
                    All Categories
                  </Link>
                </li>
              </ul>
            </div>

            {menus.slice(0, 2).map((menu) => (
              <div key={menu.label}>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {menu.label}
                </p>
                <ul className="space-y-1">
                  {menu.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="block py-1.5 text-sm text-ink hover:text-primary"
                      >
                        {item.label}
                      </Link>
                      {item.sub ? (
                        <ul className="ml-4 border-l border-slate-200 pl-3">
                          {item.sub.map((sub) => (
                            <li key={sub}>
                              <Link
                                href={item.href}
                                onClick={() => setMenuOpen(false)}
                                className="block py-1 text-[13px] text-slate-500 hover:text-primary"
                              >
                                {sub}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div>
              <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Programs
              </p>
              <ul className="space-y-1">
                {directLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setMenuOpen(false)}
                      className="block py-1.5 text-sm font-medium text-ink hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {menus.slice(2).map((menu) => (
              <div key={menu.label}>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {menu.label}
                </p>
                <ul className="space-y-1">
                  {menu.items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className="block py-1.5 text-sm text-ink hover:text-primary"
                      >
                        {item.label}
                      </Link>
                      {item.sub ? (
                        <ul className="ml-4 border-l border-slate-200 pl-3">
                          {item.sub.map((sub) => (
                            <li key={sub}>
                              <Link
                                href={item.href}
                                onClick={() => setMenuOpen(false)}
                                className="block py-1 text-[13px] text-slate-500 hover:text-primary"
                              >
                                {sub}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4 text-sm font-medium">
              <Link
                href="/help"
                onClick={() => setMenuOpen(false)}
                className="text-slate-600 hover:text-primary"
              >
                Help
              </Link>
              <Link
                href="/sign-in"
                onClick={() => setMenuOpen(false)}
                className="text-slate-600 hover:text-primary"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setMenuOpen(false)}
                className="rounded-md bg-accent px-3 py-1.5 font-semibold text-accent-ink"
              >
                Join Free
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
