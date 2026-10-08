"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { products, requirements, suppliers } from "@/lib/catalog";
import { Button, EmptyState, Input } from "./ui";
import { ProductCard, RequirementCard, SupplierCard } from "./cards";
import { ArrowRightIcon, SearchIcon } from "./icons";

const TABS = [
  { key: "all", label: "All results" },
  { key: "products", label: "Products" },
  { key: "suppliers", label: "Suppliers" },
  { key: "requirements", label: "Requirements" },
];

function match(text, query) {
  return text.toLowerCase().includes(query);
}

export default function SearchResults() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const type = searchParams.get("type") ?? "all";

  const [draft, setDraft] = useState(q);

  function push(next) {
    const params = new URLSearchParams(searchParams);
    if (next.q !== undefined) {
      if (next.q) params.set("q", next.q);
      else params.delete("q");
    }
    if (next.type !== undefined) {
      if (next.type && next.type !== "all") params.set("type", next.type);
      else params.delete("type");
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return { products: [], suppliers: [], requirements: [] };
    return {
      products: products.filter(
        (item) =>
          match(item.name, query) ||
          match(item.tags.join(" "), query) ||
          match(item.hs, query),
      ),
      suppliers: suppliers.filter(
        (item) =>
          match(item.name, query) ||
          match(item.desc, query) ||
          match(item.categories.join(" "), query),
      ),
      requirements: requirements.filter(
        (item) => match(item.title, query) || match(item.country, query),
      ),
    };
  }, [q]);

  const total =
    results.products.length + results.suppliers.length + results.requirements.length;

  const show = {
    products: type === "all" || type === "products",
    suppliers: type === "all" || type === "suppliers",
    requirements: type === "all" || type === "requirements",
  };

  return (
    <div>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          push({ q: draft });
        }}
        className="flex gap-2"
      >
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Search products, suppliers or requirements…"
            className="h-12 pl-11"
            aria-label="Search"
          />
        </div>
        <Button type="submit" variant="navy" className="h-12 px-6">
          Search
        </Button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => push({ type: tab.key })}
              className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-[13px] font-semibold transition ${
                type === tab.key
                  ? "bg-primary text-white"
                  : "text-slate-600 hover:bg-slate-50 hover:text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <p className="text-[13px] text-slate-500">
          {q ? (
            <>
              <span className="font-semibold text-ink">{total}</span> results for
              “{q}”
            </>
          ) : (
            "Enter a term to search the marketplace"
          )}
        </p>
      </div>

      {!q ? (
        <div className="mt-6">
          <EmptyState
            title="Try a product, HS code or market"
            text="Examples: spices, 0910, textiles, Morocco, cotton yarn."
            action={
              <Button variant="soft" size="sm" onClick={() => push({ q: "spices" })}>
                Search “spices”
              </Button>
            }
          />
        </div>
      ) : total === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="No matches yet"
            text="Broaden the wording, or post a requirement so suppliers come to you."
            action={
              <Button href="/rfq" variant="accent" size="sm">
                Post a requirement <ArrowRightIcon className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 space-y-9">
          {show.products && results.products.length ? (
            <section>
              <p className="label-xs">Products ({results.products.length})</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.products.map((product) => (
                  <ProductCard key={product.slug} product={product} />
                ))}
              </div>
            </section>
          ) : null}

          {show.suppliers && results.suppliers.length ? (
            <section>
              <p className="label-xs">Suppliers ({results.suppliers.length})</p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {results.suppliers.map((supplier) => (
                  <SupplierCard key={supplier.slug} supplier={supplier} />
                ))}
              </div>
            </section>
          ) : null}

          {show.requirements && results.requirements.length ? (
            <section>
              <p className="label-xs">
                Requirements ({results.requirements.length})
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.requirements.map((item) => (
                  <RequirementCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
