import { dashboard } from "@/lib/catalog";
import { Avatar, Badge, Button } from "@/components/ui";
import { ArrowRightIcon, BoxIcon, InboxIcon, TagIcon } from "@/components/icons";
import { DataTable, Pill, SampleNote, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import Link from "next/link";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  await requirePermission("dashboard.home");
  const stages = ["New", "Negotiating", "Sampling", "Closed"];

  return (
    <>
      <WorkspaceHeader
        title={`Welcome back, ${dashboard.user.name.split(" ")[0]}`}
        description={`${dashboard.user.company} · ${dashboard.user.role}. Your activity across buying and selling in one view.`}
        actions={
          <>
            <Button href="/dashboard/products" variant="outline" size="sm">
              <BoxIcon className="h-4 w-4" /> Manage products
            </Button>
            <Button href="/rfq" variant="accent" size="sm">
              Post Your Requirement
            </Button>
          </>
        }
      />

      <StatCards items={dashboard.stats} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Section
          title="Latest inquiries"
          action={
            <Link
              href="/dashboard/inquiries"
              className="flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline"
            >
              View all <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <div className="space-y-2">
            {dashboard.inquiries.map((item) => (
              <div
                key={item.subject}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5"
              >
                <Avatar name={item.from} className="h-9 w-9 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm font-semibold text-ink">
                    {item.from}
                    <span className="text-[12px] font-normal text-slate-400">
                      {item.country}
                    </span>
                    {item.unread ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
                    ) : null}
                  </p>
                  <p className="truncate text-[13px] text-slate-500">
                    {item.subject}
                  </p>
                </div>
                <div className="hidden shrink-0 text-right sm:block">
                  <Pill>{item.stage}</Pill>
                  <p className="mt-1 text-[11px] text-slate-400">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <div className="space-y-6">
          <Section
            title="Matched leads"
            action={
              <Link
                href="/dashboard/leads"
                className="flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline"
              >
                All leads <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            }
          >
            <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-2">
              {dashboard.leads.slice(0, 3).map((lead) => (
                <div
                  key={lead.title}
                  className="flex items-center gap-3 rounded-lg px-2 py-2 transition hover:bg-surface"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary/10 font-display text-[12px] font-bold text-primary">
                    {lead.match}%
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-ink">
                      {lead.title}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {lead.country} · {lead.value}
                    </p>
                  </div>
                  <Pill>{lead.stage}</Pill>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Pipeline at a glance">
            <div className="grid grid-cols-2 gap-2">
              {stages.map((stage) => {
                const count = dashboard.inquiries.filter((item) => item.stage === stage).length;
                return (
                  <div key={stage} className="rounded-xl border border-slate-200 bg-white p-4">
                    <p className="label-xs">{stage}</p>
                    <p className="mt-1 font-display text-2xl font-bold text-primary">
                      {count}
                    </p>
                  </div>
                );
              })}
            </div>
          </Section>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Section
          title="My requirements"
          action={
            <Link
              href="/dashboard/requirements"
              className="flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline"
            >
              Manage <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <DataTable
            columns={[
              { key: "id", label: "Ref", emphasis: true },
              { key: "title", label: "Requirement" },
              { key: "qty", label: "Quantity" },
              { key: "quotes", label: "Quotes" },
              { key: "status", label: "Status", pill: true },
            ]}
            rows={dashboard.requirements}
          />
        </Section>

        <Section
          title="Products"
          action={
            <Link
              href="/dashboard/products"
              className="flex items-center gap-1 text-[13px] font-semibold text-primary hover:underline"
            >
              Manage <ArrowRightIcon className="h-3.5 w-3.5" />
            </Link>
          }
        >
          <DataTable
            columns={[
              { key: "name", label: "Product", emphasis: true },
              { key: "views", label: "Views" },
              { key: "inquiries", label: "Inquiries" },
              { key: "status", label: "Status", pill: true },
            ]}
            rows={dashboard.products}
          />
        </Section>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/8 text-primary">
          <InboxIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink">
            {dashboard.requirements.filter((item) => item.status === "Open").length} open requirement
            responding right now
          </p>
          <p className="text-[13px] text-slate-500">
            Suppliers are quoting — reply to keep your ranking on the board.
          </p>
        </div>
        <Link
          href="/dashboard/requirements"
          className="flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline"
        >
          <TagIcon className="h-4 w-4" /> Open board
        </Link>
      </div>

      <SampleNote />
    </>
  );
}
