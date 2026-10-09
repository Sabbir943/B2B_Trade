import { Button, EmptyState } from "@/components/ui";
import { ArrowRightIcon, BoxIcon, InboxIcon, TagIcon } from "@/components/icons";
import { DataTable, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import Link from "next/link";
import { requirePermission } from "@/lib/session";
import { roleLabel } from "@/lib/permissions";

export const metadata = { title: "Dashboard" };

const inquiries = [];
const leads = [];
const requirements = [];
const products = [];

const stats = [
  { label: "Profile views", value: "0", hint: "No activity yet" },
  { label: "New inquiries", value: "0", hint: "No activity yet" },
  { label: "Active listings", value: "0", hint: "No activity yet" },
  { label: "Matched leads", value: "0", hint: "No activity yet" },
];

export default async function DashboardPage() {
  const { user, role } = await requirePermission("dashboard.home");
  const firstName = (user.name || "there").split(" ")[0];
  const stages = ["New", "Negotiating", "Sampling", "Closed"];

  return (
    <>
      <WorkspaceHeader
        title={`Welcome back, ${firstName}`}
        description={`${roleLabel(role)} · Your activity across buying and selling in one view.`}
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

      <StatCards items={stats} />

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
          <EmptyState
            icon={<InboxIcon className="h-5 w-5" />}
            title="No inquiries yet"
            text="Buyer conversations appear here as soon as buyers contact you through your listings."
            action={
              <Button href="/dashboard/profile" variant="navy" size="sm">
                Complete your profile
              </Button>
            }
          />
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
            <EmptyState
              title="No matched leads yet"
              text="Buy requirements scored against your categories will show up here."
              action={
                <Button href="/requirements" variant="outline" size="sm">
                  Browse the board
                </Button>
              }
            />
          </Section>

          <Section title="Pipeline at a glance">
            <div className="grid grid-cols-2 gap-2">
              {stages.map((stage) => {
                const count = inquiries.filter((item) => item.stage === stage).length;
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
            rows={requirements}
            empty="No requirements posted yet."
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
            rows={products}
            empty="No products listed yet."
          />
        </Section>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/8 text-primary">
          <InboxIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink">
            Post a requirement to start receiving supplier quotes
          </p>
          <p className="text-[13px] text-slate-500">
            Describe specs, quantity, destination and budget — matching suppliers
            respond on the board.
          </p>
        </div>
        <Link
          href="/rfq"
          className="flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline"
        >
          <TagIcon className="h-4 w-4" /> Post a requirement
        </Link>
      </div>
    </>
  );
}
