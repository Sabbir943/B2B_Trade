import { Badge } from "@/components/ui";
import { DataTable, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import SiteContentEditor from "@/components/site-content-editor";
import CategoryManager from "@/components/category-manager";
import { requirePermission } from "@/lib/session";
import { articles } from "@/lib/articles";
import { insights } from "@/lib/catalog";
import { faqGroups } from "@/lib/content";
import { readSiteContent, SITE_CONTENT_SECTIONS } from "@/lib/site-content";
import { listCategories } from "@/lib/categories-db";

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

  const [content, categories] = await Promise.all([
    readSiteContent(),
    listCategories(),
  ]);

  // Hydrate each section definition with its live (or default) value so the
  // client editor starts from what the public pages currently show.
  const sections = SITE_CONTENT_SECTIONS.map((section) => ({
    ...section,
    value: content[section.key] ?? {},
  }));

  const subcategories = categories.reduce((sum, item) => sum + (item.sub?.length || 0), 0);
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
        description="Edit the words and images buyers see, manage catalogue categories, and review the article and policy inventory below. Every save is audit-logged and goes live immediately."
      />

      <StatCards items={stats} />

      <Section className="mt-6" title="Site editor">
        <SiteContentEditor sections={sections} />
      </Section>

      <Section className="mt-6" title="Category manager">
        <CategoryManager categories={categories} />
      </Section>

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
