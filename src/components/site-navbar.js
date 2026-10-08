"use client";

import { useState } from "react";
import Link from "next/link";
import MarketSearch from "./market-search";
import BrandLogo from "./brand-logo";
import { shell } from "./shell";
import {
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
      { label: "Browse Buy Requirements", href: "/requirements" },
      {
        label: "List Products",
        href: "/dashboard/products",
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

function Dropdown({ label, items, wide = false, align = "left" }) {
  const panelPos = align === "right" ? "right-0" : "left-0";

  return (
    <li className="group relative">
      <button
        type="button"
        aria-haspopup="true"
        className="flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white"
      >
        {label}
        <ChevronDownIcon className="h-3.5 w-3.5 text-white/50 transition-colors group-hover:text-white" />
      </button>

      <div
        className={`invisible absolute top-full z-40 pt-1.5 opacity-0 transition duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 ${panelPos}`}
      >
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
        className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
      >
        <span className="flex flex-col gap-[3px]">
          <span className="block h-[2px] w-3.5 rounded-full bg-accent" />
          <span className="block h-[2px] w-3.5 rounded-full bg-accent" />
          <span className="block h-[2px] w-3.5 rounded-full bg-accent" />
        </span>
        All Categories
        <ChevronDownIcon className="h-3.5 w-3.5 text-white/50 transition-colors group-hover:text-white" />
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
    <header className="sticky top-0 z-50 border-b border-white/10 bg-primary shadow-sm">
      <div className="hidden border-b border-white/10 md:block">
        <div className={`flex h-9 items-center justify-between ${shell}`}>
          <div className="flex items-center gap-4 text-xs text-white/70">
            <span className="flex items-center gap-1.5">
              <GlobeIcon className="h-3.5 w-3.5 text-secondary" />
              English
            </span>
            <span className="text-white/25" aria-hidden="true">
              |
            </span>
            <span>
              Currency:{" "}
              <span className="font-semibold text-white">USD</span>
            </span>
            <span className="text-white/25" aria-hidden="true">
              |
            </span>
            <span>Import &amp; Export</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <Link
              href="/contact"
              className="text-white/70 transition-colors hover:text-white"
            >
              Help
            </Link>
            <Link
              href="/sign-in"
              className="flex items-center gap-1.5 text-white/85 transition-colors hover:text-white"
            >
              <UserIcon className="h-3.5 w-3.5" />
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="rounded-md bg-accent px-3 py-1 font-semibold text-accent-ink transition hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Join Free
            </Link>
          </div>
        </div>
      </div>

      <div className={`flex h-14 items-center gap-2 md:h-16 md:gap-3 ${shell}`}>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/25 text-white transition-colors hover:bg-white/10 md:hidden"
        >
          {menuOpen ? (
            <CloseIcon className="h-5 w-5" />
          ) : (
            <MenuIcon className="h-5 w-5" />
          )}
        </button>

        <BrandLogo tone="onDark" wordmarkClassName="hidden min-[400px]:block" />

        <MarketSearch
          id="header-search"
          className="hidden min-w-0 max-w-[680px] flex-1 md:flex"
        />

        <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0 md:gap-3">
          <Link
            href="/rfq"
            className="whitespace-nowrap rounded-md bg-accent px-3 py-2 text-[12px] font-semibold text-accent-ink transition hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:px-4 md:py-2.5 md:text-sm"
          >
            Post Your Requirement
          </Link>
        </div>
      </div>

      <div className="border-t border-white/10 md:hidden">
        <div className={`py-2 ${shell}`}>
          <MarketSearch id="mobile-search" />
        </div>
      </div>

      <div className="hidden border-t border-white/10 md:block">
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
                  className="block rounded-md px-3 py-2 text-sm font-medium text-white/85 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
            {menus.slice(2).map((menu) => (
              <Dropdown
                key={menu.label}
                label={menu.label}
                items={menu.items}
                align="right"
              />
            ))}
          </ul>
        </nav>
      </div>

      <div
        id="mobile-menu"
        className={`grid overflow-hidden border-t border-white/15 transition-[grid-template-rows] duration-300 ease-out md:hidden ${
          menuOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 bg-white">
          <div className={`space-y-5 py-4 ${shell}`}>
            <Link
              href="/rfq"
              onClick={() => setMenuOpen(false)}
              className="block rounded-md bg-accent px-4 py-2.5 text-center text-sm font-semibold text-accent-ink transition hover:bg-accent-dark"
            >
              Post Your Requirement
            </Link>

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
                href="/contact"
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
