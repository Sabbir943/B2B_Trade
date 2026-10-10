import { shell } from "@/components/shell";
import { Badge, Button, EmptyState, PageHeader } from "@/components/ui";
import { InboxIcon } from "@/components/icons";
import Link from "next/link";
import { getPublishedRequirements } from "@/lib/requirements";
import { categories, categoriesById } from "@/lib/catalog";
import { formatDate } from "@/lib/refs";
import { connection } from "next/server";

export const instant = false;

export const metadata = { title: "Buy requirements" };


/**
 * §7.3 public demand board — published buyer posts only (pending ones
 * never reach this page until staff approve them).
 */
export default async function RequirementsPage({ searchParams }) {
  await connection();
  const { category = "" } = await searchParams;
  const requirements = await getPublishedRequirements({ category: category || undefined, limit: 60 });

  return (
    <>
      <PageHeader
        eyebrow="Demand board"
        title="Live buy requirements"
        description="Buyers publish quantities, destinations and target dates. Suppliers respond with pricing, lead times and samples — no cold outreach required."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Requirements" }]}
        actions={
          <>
            <Button href="/supplier-guide" variant="outline">
              How to respond
            </Button>
            <Button href="/rfq" variant="accent">
              Post your requirement
            </Button>
          </>
        }
      />

      <section className={`py-8 sm:py-10 ${shell}`}>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/requirements"
            className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${
              !category ? "border-primary bg-primary text-white" : "border-slate-200 bg-white text-slate-600 hover:border-primary"
            }`}
          >
            All
          </Link>
          {categories.map((item) => (
            <Link
              key={item.slug}
              href={`/requirements?category=${item.slug}`}
              className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${
                category === item.slug
                  ? "border-primary bg-primary text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-primary"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        {requirements.length ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {requirements.map((item) => {
              const posted = item.publishedAt || item.createdAt;
              return (
                <Link
                  key={item.id}
                  href={`/requirements/${item.id}`}
                  className="panel group flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone={item.status === "awarded" ? "navy" : item.status === "closed" ? "slate" : "green"}>
                      {item.status === "awarded" ? "Awarded" : item.status === "closed" ? "Closed" : "Open"}
                    </Badge>
                    <span className="text-[12px] text-slate-500">{item.id}</span>
                  </div>
                  <h3 className="font-display text-[15px] font-bold leading-snug text-primary group-hover:underline">
                    {item.product}
                  </h3>
                  <p className="text-[13px] text-slate-600">
                    {categoriesById[item.category]?.name || item.category} ·{" "}
                    {item.shippingTerms} to {item.destinationPort || "unspecified"}
                  </p>
                  <dl className="mt-auto grid grid-cols-2 gap-x-3 gap-y-2 border-t border-slate-100 pt-3 text-[12px]">
                    <div>
                      <dt className="text-slate-500">Quantity</dt>
                      <dd className="font-semibold text-ink">
                        {item.quantity} {item.unit}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Target date</dt>
                      <dd className="font-semibold text-ink">{item.targetDate || "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Posted</dt>
                      <dd className="font-semibold text-ink">{formatDate(posted)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">Payment</dt>
                      <dd className="font-semibold text-ink">{item.paymentTerms || "To be agreed"}</dd>
                    </div>
                  </dl>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              icon={<InboxIcon className="h-5 w-5" />}
              title="No open requirements right now"
              text="New buyer posts land after moderation — create a free supplier account and matching alerts reach you first."
              action={
                <Button href="/sign-up" variant="navy" size="sm">
                  Create a free account
                </Button>
              }
            />
          </div>
        )}
      </section>
    </>
  );
}
