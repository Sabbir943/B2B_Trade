import { notFound } from "next/navigation";
import { requirements } from "@/lib/catalog";
import { shell } from "@/components/shell";
import { Badge, Breadcrumbs, Button, Panel, SectionTitle } from "@/components/ui";
import { RequirementCard } from "@/components/cards";
import { AlertIcon, ClockIcon, ShieldIcon } from "@/components/icons";

export const metadata = { title: "Requirement" };

export const instant = false;

export default async function RequirementDetailPage({ params }) {
  const { slug } = await params;
  const item = requirements.find(
    (entry) => `${entry.id}-${entry.slug}` === slug,
  );
  if (!item) notFound();

  const related = requirements.filter((entry) => entry.id !== item.id).slice(0, 3);

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
              <Badge tone={item.status === "Closing soon" ? "amber" : "green"}>
                {item.status}
              </Badge>
              <Badge tone="slate">{item.id}</Badge>
              <Badge tone="slate">Posted {item.posted}</Badge>
            </div>
            <h1 className="mt-3 font-display text-xl font-bold leading-tight text-primary sm:text-2xl">
              {item.title}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {item.buyer} · {item.country}
            </p>

            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-4">
              <div>
                <dt className="label-xs">Quantity</dt>
                <dd className="mt-1 font-display text-base font-bold text-primary">
                  {item.qty}
                </dd>
              </div>
              <div>
                <dt className="label-xs">Budget</dt>
                <dd className="mt-1 font-display text-base font-bold text-primary">
                  {item.budget}
                </dd>
              </div>
              <div>
                <dt className="label-xs">Incoterm</dt>
                <dd className="mt-1 font-display text-base font-bold text-primary">
                  {item.incoterm}
                </dd>
              </div>
              <div>
                <dt className="label-xs">Closes</dt>
                <dd className="mt-1 font-display text-base font-bold text-primary">
                  {item.deadline}
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel>
            <p className="label-xs">Buyer notes</p>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              {item.desc ? `${item.desc} ` : null}Quotes should include unit
              pricing, packing details, lead time from the loading port and
              sample availability. Certified suppliers with shipment history in
              this category will be reviewed first.
            </p>
          </Panel>

          <Panel>
            <p className="flex items-center gap-2 text-[13px] font-bold text-primary">
              <ShieldIcon className="h-4 w-4" /> Trade desk check
            </p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li className="flex gap-2">
                <AlertIcon className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                Keep payment and sampling conversations on-platform until
                contracts are agreed.
              </li>
              <li className="flex gap-2">
                <ClockIcon className="mt-0.5 h-4 w-4 shrink-0 text-secondary" />
                Responses close with the deadline above — early quotes rank
                higher.
              </li>
            </ul>
          </Panel>
        </div>

        <div className="space-y-4">
          <div className="panel sticky top-28 p-5">
            <p className="label-xs">Respond</p>
            <p className="mt-1 font-display text-lg font-bold text-primary">
              Quote for this requirement
            </p>
            <p className="mt-2 text-[13px] leading-6 text-slate-600">
              Send pricing, lead time and packing in one message. The buyer sees
              your certification level beside your response.
            </p>
            <Button href="/sign-up" variant="navy" className="mt-4 w-full">
              Respond as a supplier
            </Button>
            <Button href="/rfq" variant="outline" size="sm" className="mt-2 w-full">
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
              <RequirementCard key={entry.id} item={entry} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
