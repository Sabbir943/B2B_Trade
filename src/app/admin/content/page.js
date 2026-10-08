import { admin } from "@/lib/catalog";
import { Button } from "@/components/ui";
import { FileTextIcon } from "@/components/icons";
import { DataTable, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "Content" };

export default async function AdminContentPage() {
  await requirePermission("admin.content");
  const stats = [
    { label: "Published items", value: "214", hint: "Articles, pages, categories" },
    { label: "Drafts", value: "9", hint: "3 overdue for review" },
    { label: "Scheduled", value: "4", hint: "Next: 10 Oct" },
    { label: "Translations", value: "78%", hint: "Bangla coverage" },
  ];

  const libraries = [
    ["Trade insights", "4 articles live · 2 drafts"],
    ["Category pages", "12 categories · 48 subcategories"],
    ["Help & policies", "5 policies · 18 FAQs"],
    ["Email templates", "11 transactional templates"],
  ];

  return (
    <>
      <WorkspaceHeader
        title="Content"
        description="Articles, category copy, policies and templates. Publishing requires a second set of eyes for policy pages."
        actions={
          <>
            <Button variant="outline" size="sm">
              Content calendar
            </Button>
            <Button variant="navy" size="sm">
              New article
            </Button>
          </>
        }
      />

      <StatCards items={stats} />

      <Section className="mt-6" title="Recently edited">
        <DataTable
          columns={[
            { key: "id", label: "Item ID", emphasis: true },
            { key: "item", label: "Title" },
            { key: "type", label: "Type" },
            { key: "updated", label: "Updated" },
            { key: "status", label: "Status", pill: true },
          ]}
          rows={admin.content}
        />
      </Section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {libraries.map(([title, text]) => (
          <div key={title} className="panel p-5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-secondary/10 text-secondary">
              <FileTextIcon className="h-4 w-4" />
            </span>
            <p className="mt-3 font-display text-sm font-bold text-primary">{title}</p>
            <p className="mt-1 text-[13px] leading-6 text-slate-600">{text}</p>
            <Button variant="outline" size="sm" className="mt-3">
              Manage
            </Button>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[12px] text-slate-400">
        Sample data shown for preview purposes.
      </p>
    </>
  );
}
