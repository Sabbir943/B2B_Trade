import { notFound } from "next/navigation";
import { insights } from "@/lib/catalog";
import { articles } from "@/lib/articles";
import ProsePage from "@/components/prose-page";
import { Badge } from "@/components/ui";

export function generateStaticParams() {
  return insights.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const article = insights.find((item) => item.slug === slug);
  return { title: article ? article.title : "Insight" };
}

export default async function InsightPage({ params }) {
  const { slug } = await params;
  const meta = insights.find((item) => item.slug === slug);
  const body = articles[slug];
  if (!meta || !body) notFound();

  return (
    <>
      <ProsePage
        eyebrow={
          <span className="flex items-center gap-2">
            <Badge tone="navy">{meta.category}</Badge>
            Trade Insights
          </span>
        }
        title={meta.title}
        description={meta.excerpt}
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Insights", href: "/insights" },
          { label: meta.title },
        ]}
        updated={`${meta.date} · ${meta.author} · ${meta.read} read`}
        intro={meta.excerpt}
        sections={body.sections}
        related={[
          { label: "All insights", href: "/insights" },
          { label: "Buyer Guide", href: "/buyer-guide" },
          { label: "Sourcing Desk", href: "/sourcing-service" },
        ]}
      />
    </>
  );
}
