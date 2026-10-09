import { requirements as board } from "@/lib/catalog";
import { Badge, Button, EmptyState } from "@/components/ui";
import { DataTable, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import Link from "next/link";
import { requirePermission } from "@/lib/session";

export const metadata = { title: "My requirements" };

const posts = [];

const stats = [
  { label: "Open posts", value: "0", hint: "No activity yet" },
  { label: "Quotes received", value: "0", hint: "No activity yet" },
  { label: "Awarded", value: "0", hint: "No activity yet" },
  { label: "Median response", value: "—", hint: "No activity yet" },
];

export default async function RequirementsPage() {
  await requirePermission("member.requirements");

  return (
    <>
      <WorkspaceHeader
        title="My requirements"
        description="Posts you have published on the buy board. Compare quotes, shortlist suppliers and award when ready."
        actions={
          <Button href="/rfq" variant="accent" size="sm">
            Post Your Requirement
          </Button>
        }
      />

      <StatCards items={stats} />

      <Section className="mt-6" title="Your posts">
        <DataTable
          columns={[
            { key: "id", label: "Ref", emphasis: true },
            { key: "title", label: "Requirement" },
            { key: "qty", label: "Quantity" },
            { key: "quotes", label: "Quotes" },
            { key: "deadline", label: "Closes" },
            { key: "status", label: "Status", pill: true },
          ]}
          rows={posts}
          empty="You haven't posted a requirement yet."
        />
      </Section>

      <div className="mt-6">
        <Section
          title="Open board — quoting now"
          action={
            <Link
              href="/requirements"
              className="text-[13px] font-semibold text-primary hover:underline"
            >
              View public board
            </Link>
          }
        >
          {board.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {board.slice(0, 3).map((item) => (
                <div key={item.id} className="panel flex flex-col p-5">
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone="navy">{item.country}</Badge>
                    <span className="text-[12px] text-slate-500">{item.posted}</span>
                  </div>
                  <p className="mt-3 font-display text-sm font-bold text-primary">
                    {item.title}
                  </p>
                  <p className="mt-1 text-[13px] text-slate-600">
                    {item.qty} · {item.budget}
                  </p>
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <span className="text-[12px] text-slate-500">
                      Closes {item.deadline}
                    </span>
                    <Link
                      href={`/requirements/${item.id}-${item.slug}`}
                      className="text-[13px] font-semibold text-primary hover:underline"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No open requirements on the board"
              text="Public buyer posts will appear here as soon as they are published."
            />
          )}
        </Section>
      </div>
    </>
  );
}
