import Link from "next/link";
import { Button, Badge, EmptyState } from "@/components/ui";
import { ArrowRightIcon, BoxIcon, InboxIcon, TagIcon, UsersIcon } from "@/components/icons";
import { DataTable, Section, StatCards, WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import { roleLabel } from "@/lib/permissions";
import { getProfile, completeness } from "@/lib/profile";
import { getListingsBySeller } from "@/lib/listings";
import { getRequirementsByBuyer, quoteCountByRequirement, getVisibleMatches } from "@/lib/requirements";
import { getThreadsFor, THREAD_STAGES } from "@/lib/inbox";
import { getActiveBadge } from "@/lib/verification";
import { formatDate } from "@/lib/refs";
import { connection } from "next/server";

export const instant = false;

export const metadata = { title: "Dashboard" };


/**
 * §7 member dashboard overview — real listings, requirements, inbox threads
 * and scored leads for the signed-in account, plus the profile-completeness
 * banner from §7.1.4.
 */
export default async function DashboardPage() {
  await connection();
  const { user, role } = await requirePermission("dashboard.home");
  const email = String(user.email).toLowerCase();
  const firstName = (user.name || "there").split(" ")[0];

  const [profile, listings, requirements, threads, matches, badge] = await Promise.all([
    getProfile(email),
    getListingsBySeller(email),
    getRequirementsByBuyer(email),
    getThreadsFor(email),
    getVisibleMatches(email),
    getActiveBadge(email),
  ]);

  const meter = completeness(profile);
  const quoteCounts = await quoteCountByRequirement(requirements.map((item) => item.id));

  const approved = listings.filter((item) => item.status === "approved").length;
  const openRequirements = requirements.filter((item) => ["pending", "published"].includes(item.status)).length;
  const unread = threads.reduce((sum, thread) => sum + (thread.unread || 0), 0);
  const stageCounts = THREAD_STAGES.map((stage) => ({
    stage,
    count: threads.filter((thread) => thread.stage === stage).length,
  }));

  const stats = [
    { label: "Profile completeness", value: `${meter.percent}%`, hint: meter.percent >= 70 ? "Search-ready" : "Aim for 70%+" },
    { label: "Live listings", value: String(approved), hint: `${listings.length} total` },
    { label: "Open requirements", value: String(openRequirements), hint: `${requirements.length} posted` },
    { label: "Matched leads", value: String(matches.length), hint: `${unread} unread message${unread === 1 ? "" : "s"}` },
  ];

  const latestThreads = threads.slice(0, 5);
  const latestMatches = matches.slice(0, 5);

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

      {meter.percent < 70 ? (
        <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-amber-100 text-amber-700">
            <UsersIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-ink">
              Your profile is {meter.percent}% complete — below the 70% search threshold
            </p>
            <p className="text-[13px] text-slate-600">
              Add company details, trade terms and categories so matching and ranking work.
            </p>
          </div>
          <Button href="/dashboard/profile" variant="navy" size="sm">
            Complete profile
          </Button>
        </div>
      ) : null}

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
          {latestThreads.length ? (
            <div className="divide-y divide-slate-100">
              {latestThreads.map((thread) => (
                <Link
                  key={thread.id}
                  href={`/dashboard/inquiries/${thread.id}`}
                  className="flex items-center gap-3 px-1 py-3 transition hover:bg-surface"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {thread.subject || "Inquiry"}
                      {thread.unread ? (
                        <span className="ml-2 rounded-full bg-accent/20 px-2 py-0.5 text-[11px] font-bold text-accent-ink">
                          {thread.unread} new
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-[12px] text-slate-500">
                      {thread.counterpartName} · {thread.relativeTime}
                    </p>
                  </div>
                  <Badge tone="slate">{thread.stage}</Badge>
                </Link>
              ))}
            </div>
          ) : (
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
          )}
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
            {latestMatches.length ? (
              <div className="divide-y divide-slate-100">
                {latestMatches.map((match) => (
                  <div key={match.id} className="flex items-center gap-3 px-1 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">
                        {match.requirement.title}
                      </p>
                      <p className="truncate text-[12px] text-slate-500">
                        {match.requirement.quantity} · {match.requirement.destinationCountry}
                      </p>
                    </div>
                    <span className="rounded-md bg-accent/20 px-2 py-1 text-[12px] font-bold text-accent-ink">
                      {match.score}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No matched leads yet"
                text="Buy requirements scored against your categories will show up here."
                action={
                  <Button href="/requirements" variant="outline" size="sm">
                    Browse the board
                  </Button>
                }
              />
            )}
          </Section>

          <Section title="Pipeline at a glance">
            <div className="grid grid-cols-2 gap-2">
              {stageCounts.map(({ stage, count }) => (
                <div key={stage} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="label-xs">{stage}</p>
                  <p className="mt-1 font-display text-2xl font-bold text-primary">{count}</p>
                </div>
              ))}
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
            rows={requirements.slice(0, 8).map((item) => ({
              id: item.id,
              title: item.title,
              qty: item.quantity,
              quotes: String(quoteCounts.get(item.id) ?? 0),
              status: item.status,
            }))}
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
              { key: "title", label: "Product", emphasis: true },
              { key: "views", label: "Views" },
              { key: "updated", label: "Updated", render: (row) => formatDate(row.updatedAt) },
              { key: "status", label: "Status", pill: true },
            ]}
            rows={listings.slice(0, 8).map((item) => ({
              id: item.id,
              title: item.title,
              views: String(item.views ?? 0),
              updatedAt: item.updatedAt,
              status: item.status,
            }))}
            empty="No products listed yet."
          />
        </Section>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/8 text-primary">
          <TagIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink">
            {badge ? `Verified: ${badge.levelLabel} — issued ${formatDate(badge.awardedAt)}` : "Post a requirement to start receiving supplier quotes"}
          </p>
          <p className="text-[13px] text-slate-500">
            {badge
              ? "Your badge shows on listings and the supplier directory until it expires."
              : "Describe specs, quantity, destination and budget — matching suppliers respond on the board."}
          </p>
        </div>
        <Link
          href={badge ? "/dashboard/verification" : "/rfq"}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline"
        >
          {badge ? "Verification status" : "Post a requirement"} <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </>
  );
}
