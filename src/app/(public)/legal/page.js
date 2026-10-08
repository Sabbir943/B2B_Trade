import { legalDocs } from "@/lib/content";
import { shell } from "@/components/shell";
import { Button, PageHeader } from "@/components/ui";
import { ArrowRightIcon } from "@/components/icons";
import Link from "next/link";

export const metadata = { title: "Legal & policies" };

const order = [
  "terms",
  "privacy",
  "product-listing-policy",
  "refund-policy",
  "trust-safety",
];

export default function LegalIndexPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal & Help"
        title="Policies and legal documents"
        description="The rules that govern membership, listings, billing and safety on the marketplace — written to be read, not skimmed."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Legal" }]}
        actions={
          <Button href="/contact" variant="navy">
            Contact support
          </Button>
        }
      />

      <section className={`py-8 sm:py-10 ${shell}`}>
        <div className="grid gap-4 sm:grid-cols-2">
          {order.map((key) => {
            const doc = legalDocs[key];
            return (
              <Link
                key={key}
                href={`/legal/${key}`}
                className="panel group flex flex-col gap-2 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <p className="label-xs">Updated {doc.updated}</p>
                <h2 className="font-display text-base font-bold text-primary group-hover:underline">
                  {doc.title}
                </h2>
                <p className="text-[13px] leading-6 text-slate-600">
                  {doc.intro}
                </p>
                <span className="mt-auto flex items-center gap-1.5 pt-2 text-[13px] font-semibold text-primary">
                  Read policy <ArrowRightIcon className="h-3.5 w-3.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
