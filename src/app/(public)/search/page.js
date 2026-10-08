import { Suspense } from "react";
import { shell } from "@/components/shell";
import { PageHeader } from "@/components/ui";
import SearchResults from "@/components/search-results";

export const metadata = { title: "Search" };

export default function SearchPage() {
  return (
    <>
      <PageHeader
        eyebrow="Marketplace search"
        title="Search the marketplace"
        description="One query across product listings, supplier profiles and open buy requirements."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Search" }]}
      />
      <section className={`py-8 sm:py-10 ${shell}`}>
        <Suspense
          fallback={
            <p className="text-sm text-slate-500">Loading search…</p>
          }
        >
          <SearchResults />
        </Suspense>
      </section>
    </>
  );
}
