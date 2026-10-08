import ApplyForm from "@/components/apply-form";
import { shell } from "@/components/shell";
import { PageHeader } from "@/components/ui";
import { CheckIcon } from "@/components/icons";

export const metadata = { title: "Market Entry application" };

const notes = [
  "A scoping call within two working days of submission",
  "No fee until an engagement scope is agreed",
  "One named officer from application to first shipment",
];

export default function MarketEntryApplyPage() {
  return (
    <>
      <PageHeader
        eyebrow="Bangladesh Market Entry"
        title="Start an application"
        description="Tell us what you want to source or launch. The desk reviews every application personally — no automated rejections."
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Market Entry", href: "/market-entry" },
          { label: "Apply" },
        ]}
      />

      <section className={`py-8 sm:py-10 ${shell}`}>
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="panel p-6 sm:p-8">
            <ApplyForm />
          </div>

          <aside className="space-y-4">
            <div className="panel p-5">
              <p className="label-xs">What happens next</p>
              <ul className="mt-3 space-y-3">
                {notes.map((note) => (
                  <li key={note} className="flex gap-2.5 text-[13px] leading-6 text-slate-600">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-success/12 text-success">
                      <CheckIcon className="h-3.5 w-3.5" />
                    </span>
                    {note}
                  </li>
                ))}
              </ul>
            </div>

            <div className="panel bg-surface p-5">
              <p className="text-[13px] font-bold text-primary">Prefer to talk?</p>
              <p className="mt-2 text-[13px] leading-6 text-slate-600">
                Call the market entry desk Sunday–Thursday, 09:00–18:00 BST.
              </p>
              <p className="mt-2 text-sm font-semibold text-ink">
                +880 2 55 000 000
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
