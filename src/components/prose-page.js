import Link from "next/link";
import { shell } from "./shell";
import { PageHeader } from "./ui";
import { ArrowRightIcon, LifeBuoyIcon } from "./icons";

function anchor(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function ProsePage({
  eyebrow,
  title,
  description,
  breadcrumbs,
  updated,
  intro,
  sections,
  actions,
  related = [],
}) {
  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        description={description}
        breadcrumbs={breadcrumbs}
        actions={actions}
      />

      <section className={`py-8 sm:py-10 ${shell}`}>
        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <article className="panel p-6 sm:p-8">
            <p className="label-xs">Last updated · {updated}</p>
            <p className="mt-3 text-[15px] leading-7 text-ink">{intro}</p>

            <div className="prose-page mt-5 border-t border-slate-100 pt-2">
              {sections.map((section) => (
                <section key={section.h2} id={anchor(section.h2)}>
                  <h2>{section.h2}</h2>
                  {section.p ? <p>{section.p}</p> : null}
                  {section.list ? (
                    <ul>
                      {section.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </section>
              ))}
            </div>
          </article>

          <aside className="space-y-4">
            <div className="panel p-5">
              <p className="label-xs">On this page</p>
              <ul className="mt-3 space-y-2">
                {sections.map((section) => (
                  <li key={section.h2}>
                    <a
                      href={`#${anchor(section.h2)}`}
                      className="block text-[13px] leading-5 text-slate-600 transition hover:text-primary"
                    >
                      {section.h2}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {related.length ? (
              <div className="panel p-5">
                <p className="label-xs">Related</p>
                <ul className="mt-3 space-y-2">
                  {related.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="flex items-center justify-between gap-2 text-[13px] font-semibold text-primary hover:underline"
                      >
                        {item.label}
                        <ArrowRightIcon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="panel bg-surface p-5">
              <p className="flex items-center gap-2 text-[13px] font-bold text-primary">
                <LifeBuoyIcon className="h-4 w-4 text-secondary" />
                Need help?
              </p>
              <p className="mt-2 text-[13px] leading-6 text-slate-600">
                Our support desk answers within one working day.
              </p>
              <Link
                href="/contact"
                className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:underline"
              >
                Contact support <ArrowRightIcon className="h-3.5 w-3.5" />
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
