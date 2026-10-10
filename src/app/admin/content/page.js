import { Badge } from "@/components/ui";
import { DataTable, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import { articles } from "@/lib/articles";
import { insights, categories } from "@/lib/catalog";
import { faqGroups } from "@/lib/content";

export const instant = false;

export const metadata = { title: "Content" };

const POLICIES = [
  ["legal/terms", "Terms of Use"],
  ["legal/privacy", "Privacy Policy"],
  ["legal/refund-policy", "Refund Policy"],
  ["legal/product-listing-policy", "Product Listing Policy"],
  ["legal/trust-safety", "Trust & Safety"],
];

export default async function AdminContentPage() {
  await requirePermission("admin.content");

  const subcategories = categories.reduce((sum, item) => sum + item.sub.length, 0);
  const faqCount = faqGroups.reduce((sum, group) => sum + (group.items?.length || 0), 0);

  const stats = [
    { label: "Insight articles", value: String(insights.length), hint: "All published" },
    { label: "Categories", value: String(categories.length), hint: `${subcategories} subcategories` },
    { label: "Policy pages", value: String(POLICIES.length), hint: "Legal library" },
    { label: "FAQ entries", value: String(faqCount), hint: `${faqGroups.length} groups` },
  ];

  const articleRows = insights.map((item) => ({
    id: item.slug,
    item: item.title,
    type: item.category,
    author: item.author,
    updated: item.date,
    sections: String(articles[item.slug]?.sections?.length ?? 0),
    status: "published",
  }));

  return (
    <>
      <WorkspaceHeader
        title="Content"
        description="Everything members read — insight articles, category pages, policies and FAQs. The inventory below mirrors the files that ship with the app."
      />

      <StatCards items={stats} />

      <Section className="mt-6" title="Insight articles">
        <DataTable
          columns={[
            { key: "id", label: "Slug", emphasis: true },
            { key: "item", label: "Title" },
            { key: "type", label: "Category" },
            { key: "author", label: "Author" },
            { key: "sections", label: "Sections" },
            { key: "updated", label: "Published" },
            { key: "status", label: "Status", pill: true },
          ]}
          rows={articleRows}
        />
      </Section>

      <Section className="mt-6" title="Category library">
        <DataTable
          columns={[
            { key: "slug", label: "Slug", emphasis: true },
            { key: "name", label: "Category" },
            { key: "hs", label: "HS chapter" },
            { key: "subs", label: "Subcategories" },
          ]}
          rows={categories.map((item) => ({
            id: item.slug,
            slug: item.slug,
            name: item.name,
            hs: item.hs,
            subs: String(item.sub.length),
          }))}
        />
      </Section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="panel p-5">
          <p className="label-xs">Policy pages</p>
          <ul className="mt-3 space-y-2 text-[13px] leading-6">
            {POLICIES.map(([href, label]) => (
              <li key={href} className="flex items-center justify-between gap-3">
                <span className="text-slate-600">{label}</span>
                <Badge tone="green">live</Badge>
              </li>
            ))}
          </ul>
        </div>
        <div className="panel p-5">
          <p className="label-xs">FAQ groups</p>
          <ul className="mt-3 space-y-2 text-[13px] leading-6">
            {faqGroups.map((group) => (
              <li key={group.group} className="flex items-center justify-between gap-3">
                <span className="text-slate-600">{group.group}</span>
                <Badge tone="slate">{group.items?.length || 0} entries</Badge>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
