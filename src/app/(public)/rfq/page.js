import RfqForm from "@/components/rfq-form";
import { shell } from "@/components/shell";
import { Badge, PageHeader } from "@/components/ui";
import { CheckIcon } from "@/components/icons";

export const metadata = { title: "Post Your Requirement" };

const perks = [
  "Verified suppliers respond with specs, pricing and lead times",
  "Your email stays private until you choose to reply",
  "One post appears on the board, in search and in matched alerts",
  "No cost for buyers at any membership level",
];

const stats = [
  ["Median first response", "6 hours"],
  ["Average quotes per post", "7"],
  ["Suppliers alerted", "Matched by HS code"],
];

export default function RfqPage() {
  return (
    <>
      <PageHeader
        eyebrow="For buyers"
        title="Post Your Requirement"
        description="Describe what you need once. Checked suppliers across twelve categories come back with quotes, samples and lead times."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Post Requirement" }]}
        actions={
          <Badge tone="navy">Free for buyers</Badge>
        }
      />

      <section className={`py-8 sm:py-10 ${shell}`}>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="panel p-6 sm:p-8">
            <RfqForm />
          </div>

          <aside className="space-y-4">
            <div className="panel p-5">
              <p className="label-xs">What you get</p>
              <ul className="mt-3 space-y-3">
                {perks.map((perk) => (
                  <li key={perk} className="flex gap-2.5 text-[13px] leading-6 text-slate-600">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success/12 text-success">
                      <CheckIcon className="h-3.5 w-3.5" />
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>
            </div>

            <div className="panel bg-surface p-5">
              <p className="label-xs">Board averages</p>
              <dl className="mt-3 space-y-3">
                {stats.map(([label, value]) => (
                  <div key={label} className="flex items-baseline justify-between gap-3">
                    <dt className="text-[13px] text-slate-600">{label}</dt>
                    <dd className="font-display text-sm font-bold text-primary">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              <p className="mt-3 text-[12px] text-slate-500">
                Sample figures for demonstration.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
