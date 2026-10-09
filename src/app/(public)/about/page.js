import { shell } from "@/components/shell";
import { Button, PageHeader, SectionTitle } from "@/components/ui";
import { ArrowRightIcon, CheckIcon } from "@/components/icons";

export const metadata = { title: "About Us" };

const values = [
  {
    title: "Evidence over claims",
    text: "Every badge maps to a document we reviewed on a stated date. If we cannot show the check, we do not show the badge.",
  },
  {
    title: "Both sides of the trade",
    text: "Buyers and suppliers get equal footing: fair ranking, transparent fees and dispute routes that do not favour the payer.",
  },
  {
    title: "The record stays here",
    text: "Messages, quotes and trade records live on the platform so both parties keep the same paper trail.",
  },
  {
    title: "Plain language",
    text: "Policies, pricing and product copy are written to be understood the first time — in English, at working level.",
  },
];

const timeline = [
  { year: "2021", text: "Founded in Dhaka as a directory for export-ready manufacturers." },
  { year: "2023", text: "Verification programme launched with document-level checks." },
  { year: "2025", text: "Sourcing Desk opens; the buy requirements board goes live." },
  { year: "2026", text: "Market Entry engagements and HS-coded search roll out." },
];

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="Company"
        title="About AlliedOne"
        description="We run the verification, search and paperwork layer that lets importers and export-ready companies trade without meeting first."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "About" }]}
        actions={
          <>
            <Button href="/contact" variant="white">
              Contact us
            </Button>
            <Button href="/sign-up" variant="accent">
              Join Free
            </Button>
          </>
        }
      />

      <section className={`py-8 sm:py-10 ${shell}`}>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="panel p-6 sm:p-8">
            <p className="label-xs">The story</p>
            <p className="mt-3 text-[15px] leading-7 text-ink">
              AlliedOne started because the same question kept arriving from
              both directions: <em>how do we know the other side is real?</em>{" "}
              Importers were flying to Dhaka to check factories; manufacturers
              were burning weeks on buyers who never ordered.
            </p>
            <p className="mt-3 text-[15px] leading-7 text-ink">
              We built the answer as a platform: document-level verification,
              search that understands HS codes, a buy-requirements board that
              matches supply to demand, and a sourcing desk for the work that
              should not be automated.
            </p>
            <p className="mt-3 text-[15px] leading-7 text-ink">
              Today the marketplace covers twelve export categories — with the
              paperwork that makes those trades actually clear customs.
            </p>
          </div>

          <div className="panel p-6 sm:p-8">
            <p className="label-xs">How we work</p>
            <ul className="mt-4 space-y-4">
              {values.map((value) => (
                <li key={value.title} className="flex gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-success/12 text-success">
                    <CheckIcon className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="font-display text-base font-bold text-primary">
                      {value.title}
                    </p>
                    <p className="mt-1 text-[13px] leading-6 text-slate-600">
                      {value.text}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10">
          <SectionTitle eyebrow="Milestones" title="What we have shipped" />
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {timeline.map((item) => (
              <div key={item.year} className="panel p-5">
                <p className="font-display text-2xl font-bold text-primary">
                  {item.year}
                </p>
                <p className="mt-2 text-[13px] leading-6 text-slate-600">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 rounded-2xl bg-primary p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="font-display text-xl font-bold">
              Want to see how verification works?
            </p>
            <p className="mt-1 text-sm text-white/70">
              The full programme — levels, checks and fees — is published openly.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button href="/verification" variant="white">
              Get verified
            </Button>
            <Button
              href="/verification"
              variant="outlineWhite"
            >
              Read the programme <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
