import { notFound } from "next/navigation";
import Link from "next/link";
import { shell } from "@/components/shell";
import { Badge, Breadcrumbs, Button, Panel, SectionTitle } from "@/components/ui";
import PublicInquiry from "@/components/public-inquiry";
import { AlertIcon, ClockIcon, ShieldIcon } from "@/components/icons";
import { getRequirement, getPublishedRequirements, REQUIREMENT_STATUS } from "@/lib/requirements";
import { categoriesById } from "@/lib/catalog";
import { getSessionContext } from "@/lib/session";
import { formatDate } from "@/lib/refs";
import { connection } from "next/server";

export const instant = false;

export const metadata = { title: "Requirement" };


/**
 * §7.3 public requirement detail — buyers stay anonymous until they reply;
 * suppliers respond through the on-platform inbox.
 */
export default async function RequirementDetailPage({ params }) {
  await connection();
  const { slug } = await params;
  const id = String(slug).split("-")[0];
  const item = await getRequirement(id);
  const visible = item && [REQUIREMENT_STATUS.PUBLISHED, REQUIREMENT_STATUS.AWARDED, REQUIREMENT_STATUS.CLOSED].includes(item.status);
  if (!visible) notFound();

  const { user } = await getSessionContext();
  const isBuyer = user && String(user.email).toLowerCase() === item.email;

  const related = (await getPublishedRequirements({ category: item.category, limit: 6 })).filter(
    (entry) => entry.id !== item.id,
  );

  const statusLabel =
    item.status === REQUIREMENT_STATUS.AWARDED ? "Awarded" : item.status === REQUIREMENT_STATUS.CLOSED ? "Closed" : "Open";

  return (
    <section className={`py-7 sm:py-9 ${shell}`}>
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Requirements", href: "/requirements" },
          { label: item.id },
        ]}
      />

      <div className="mt-5 grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Panel>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={item.status === REQUIREMENT_STATUS.PUBLISHED ? "green" : "slate"}>{statusLabel}</Badge>
              <Badge tone="slate">{item.id}</Badge>
              <Badge tone="slate">Posted {formatDate(item.publishedAt || item.createdAt)}</Badge>
            </div>
            <h1 className="mt-3 font-display text-xl font-bold leading-tight text-primary sm:text-2xl">
              {item.product}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {categoriesById[item.category]?.name || item.category}
              {item.subcategory ? ` · ${item.subcategory}` : ""}
            </p>

            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-4">
              <div>
                <dt className="label-xs">Quantity</dt>
                <dd className="mt-1 font-display text-base font-bold text-primary">
                  {item.quantity} {item.unit}
                </dd>
              </div>
              <div>
                <dt className="label-xs">Target date</dt>
                <dd className="mt-1 font-display text-base font-bold text-primary">
                  {item.targetDate || "—"}
                </dd>
              </div>
              <div>
                <dt className="label-xs">Incoterm</dt>
                <dd className="mt-1 font-display text-base font-bold text-primary">
                  {item.shippingTerms}
                </dd>
              </div>
              <div>
                <dt className="label-xs">Destination</dt>
                <dd className="mt-1 font-display text-base font-bold text-primary">
                  {item.destinationPort || "—"}
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel>
            <p className="label-xs">Specifications</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">{item.specs}</p>
            {item.hsCode ? (
              <p className="mt-3 text-[13px] text-slate-500">HS code: {item.hsCode}</p>
            ) : null}
          </Panel>

          <Panel>
            <p className="flex items-center gap-2 text-[13px] font-bold text-primary">
              <ShieldIcon className="h-4 w-4" /> Trade desk check
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li className="flex gap-2">
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                Keep payment and sampling conversations on-platform until contracts are agreed.
              </li>
              <li className="flex gap-2">
                <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                The buyer reviews quotes as they arrive — early responses rank higher.
              </li>
            </ul>
          </Panel>
        </div>

        <div className="space-y-4">
          <div className="panel sticky top-28 p-5">
            <p className="label-xs">Respond</p>
            <p className="mt-1 font-display text-lg font-bold text-primary">Quote for this requirement</p>
            <p className="mt-2 text-[13px] leading-6 text-slate-600">
              Send pricing, lead time and packing in one message. Your certification
              level shows beside your response.
            </p>
            <div className="mt-4">
              {isBuyer ? (
                <Button href="/dashboard/requirements" variant="navy" className="w-full">
                  This is your requirement
                </Button>
              ) : (
                <PublicInquiry
                  to={item.email}
                  subject={`Quote: ${item.product}`}
                  requirementId={item.id}
                  signedIn={Boolean(user)}
                />
              )}
            </div>
            <Button href="/rfq" variant="outline" size="sm" className="mt-3 w-full">
              Post your own requirement
            </Button>
          </div>
        </div>
      </div>

      {related.length ? (
        <div className="mt-10">
          <SectionTitle eyebrow="More demand" title="Related requirements" />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((entry) => (
              <Link
                key={entry.id}
                href={`/requirements/${entry.id}`}
                className="panel group flex flex-col gap-3 p-5 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge tone="green">Open</Badge>
                  <span className="text-[12px] text-slate-500">{entry.id}</span>
                </div>
                <h3 className="font-display text-[15px] font-bold leading-snug text-primary group-hover:underline">
                  {entry.product}
                </h3>
                <p className="text-[13px] text-slate-600">
                  {entry.quantity} {entry.unit} · {entry.shippingTerms}
                </p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
