import Link from "next/link";
import { categories, hsCodes } from "@/lib/catalog";
import { shell } from "@/components/shell";
import { Badge, Button, PageHeader } from "@/components/ui";
import { ArrowRightIcon } from "@/components/icons";

export const metadata = { title: "All categories" };

export default function CategoriesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="All categories"
        description="Twelve trading categories with sub-category breakdowns and HS-code cross references — built for buyers who know exactly what they need."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Categories" }]}
        actions={
          <>
            <Button href="/search" variant="outline">
              Search the market
            </Button>
            <Button href="/rfq" variant="accent">
              Post a requirement
            </Button>
          </>
        }
      />

      <section className={`py-10 sm:py-12 ${shell}`}>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/categories/${category.slug}`}
              className="panel group flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="label-xs">HS {category.hs}</span>
                  <h2 className="mt-1 font-display text-base font-bold text-primary group-hover:underline">
                    {category.name}
                  </h2>
                </div>
                <ArrowRightIcon className="mt-1 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-secondary" />
              </div>
              <p className="text-[13px] leading-6 text-slate-600">
                {category.blurb}
              </p>
              <div className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
                {category.sub.slice(0, 2).map((sub) => (
                  <Badge key={sub} tone="slate">
                    {sub}
                  </Badge>
                ))}
              </div>
            </Link>
          ))}
        </div>

        <div className="panel mt-8 p-5 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="label-xs">Trade by HS code</p>
              <h2 className="mt-1 font-display text-lg font-bold text-primary">
                Heading-level landings
              </h2>
            </div>
            <Link
              href="/hs/0910"
              className="text-[13px] font-semibold text-primary hover:underline"
            >
              Browse example: HS 0910 →
            </Link>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {hsCodes.map((item) => (
              <Link
                key={item.code}
                href={`/hs/${item.code}`}
                className="panel-flat group flex items-center justify-between gap-3 px-4 py-3 transition hover:border-primary/40 hover:bg-slate-50"
              >
                <span>
                  <span className="block font-display text-sm font-bold text-primary">
                    {item.code}
                  </span>
                  <span className="block text-[12px] text-slate-500">
                    {item.title}
                  </span>
                </span>
                <ArrowRightIcon className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-secondary" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
