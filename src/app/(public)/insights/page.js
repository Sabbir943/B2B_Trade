import { insights } from "@/lib/catalog";
import { shell } from "@/components/shell";
import { Badge, Button, EmptyState, PageHeader } from "@/components/ui";
import { ArrowRightIcon, FileTextIcon } from "@/components/icons";
import Link from "next/link";

export const metadata = { title: "Trade Insights" };

export default function InsightsPage() {
  const [featured, ...rest] = insights;

  return (
    <>
      <PageHeader
        eyebrow="Resources"
        title="Trade Insights"
        description="Freight, compliance and sourcing analysis from our research desk and the officers who review listings every day."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Insights" }]}
        actions={
          <Button href="/faq" variant="outline">
            Browse FAQs
          </Button>
        }
      />

      <section className={`py-8 sm:py-10 ${shell}`}>
        {insights.length === 0 ? (
          <EmptyState
            icon={<FileTextIcon className="h-6 w-6" />}
            title="No articles yet"
            text="Insights from the research desk will appear here."
          />
        ) : (
          <>
            <Link
              href={`/insights/${featured.slug}`}
              className="group grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 transition hover:shadow-md sm:p-8 lg:grid-cols-[1fr_240px]"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="navy">{featured.category}</Badge>
                  <span className="text-[12px] text-slate-500">
                    {featured.date} · {featured.read}
                  </span>
                </div>
                <h2 className="mt-3 font-display text-xl font-bold text-primary group-hover:underline sm:text-2xl">
                  {featured.title}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                  {featured.excerpt}
                </p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  Read article <ArrowRightIcon className="h-4 w-4" />
                </span>
              </div>
              <div className="hidden items-end justify-end lg:flex">
                <p className="text-right text-[12px] text-slate-500">
                  Featured
                  <br />
                  <span className="font-semibold text-ink">
                    {featured.author}
                  </span>
                </p>
              </div>
            </Link>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((article) => (
                <Link
                  key={article.slug}
                  href={`/insights/${article.slug}`}
                  className="panel group flex flex-col p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone="slate">{article.category}</Badge>
                    <span className="text-[12px] text-slate-500">
                      {article.read}
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-base font-bold text-primary group-hover:underline">
                    {article.title}
                  </h3>
                  <p className="mt-2 text-[13px] leading-6 text-slate-600">
                    {article.excerpt}
                  </p>
                  <p className="mt-auto flex items-center justify-between pt-4 text-[12px] text-slate-500">
                    {article.author}
                    <span className="font-semibold text-ink">
                      {article.date}
                    </span>
                  </p>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}
