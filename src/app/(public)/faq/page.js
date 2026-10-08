import { faqGroups } from "@/lib/content";
import { shell } from "@/components/shell";
import { Button, PageHeader } from "@/components/ui";
import { ArrowRightIcon } from "@/components/icons";

export const metadata = { title: "FAQs" };

export default function FaqPage() {
  return (
    <>
      <PageHeader
        eyebrow="Resources"
        title="Frequently asked questions"
        description="Answers on accounts, verification, trading on the platform and billing — grouped so you can skip straight to your topic."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "FAQs" }]}
        actions={
          <>
            <Button href="/contact" variant="outline">
              Contact support
            </Button>
            <Button href="/sign-up" variant="accent">
              Join Free
            </Button>
          </>
        }
      />

      <section className={`py-8 sm:py-10 ${shell}`}>
        <div className="grid gap-6 lg:grid-cols-2">
          {faqGroups.map((group) => (
            <div key={group.group} className="panel p-5 sm:p-6">
              <p className="label-xs">{group.group}</p>
              <div className="mt-3 divide-y divide-slate-100">
                {group.items.map((item) => (
                  <details key={item.q} className="group py-3 first:pt-0 last:pb-0">
                    <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-sm font-semibold text-ink marker:hidden transition hover:text-primary">
                      {item.q}
                      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/8 text-primary transition group-open:rotate-45">
                        <span className="text-[13px] leading-none">+</span>
                      </span>
                    </summary>
                    <p className="mt-2 text-[13px] leading-6 text-slate-600">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="panel mt-6 flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-bold text-primary">
              Still have a question?
            </p>
            <p className="mt-1 text-sm text-slate-600">
              The support desk replies within one working day.
            </p>
          </div>
          <Button href="/contact" variant="navy">
            Contact support <ArrowRightIcon className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </>
  );
}
