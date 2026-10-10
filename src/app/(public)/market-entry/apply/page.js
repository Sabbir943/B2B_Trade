import ApplyForm from "@/components/apply-form";
import { shell } from "@/components/shell";
import { Button, PageHeader } from "@/components/ui";
import { CheckIcon, WhatsAppIcon } from "@/components/icons";
import { getSessionContext } from "@/lib/session";
import { WHATSAPP_NUMBER, WHATSAPP_URL } from "@/lib/brand";

export const instant = false;

export const metadata = { title: "Market Entry application" };

const notes = [
  "A scoping call within two working days of submission",
  "No fee until an engagement scope is agreed",
  "One named officer from application to first shipment",
];

/**
 * §7.6 — applications are tied to the signed-in company account so the
 * tracking console and officer messaging work off the same identity.
 */
export default async function MarketEntryApplyPage() {
  const { user } = await getSessionContext();
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
            {user ? (
              <ApplyForm />
            ) : (
              <div className="text-center">
                <h2 className="font-display text-lg font-bold text-primary">
                  Sign in to apply
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                  Your application, officer messaging and stage history all live inside
                  your company account.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Button href="/sign-in?next=/market-entry/apply" variant="navy" size="sm">
                    Sign in
                  </Button>
                  <Button href="/sign-up" variant="outline" size="sm">
                    Create account
                  </Button>
                </div>
              </div>
            )}
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
                Message the market entry desk on WhatsApp — Sunday–Thursday,
                09:00–18:00 BST.
              </p>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-2 rounded-md bg-success px-3 py-2 text-sm font-semibold text-white transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <WhatsAppIcon className="h-4 w-4" />
                {WHATSAPP_NUMBER}
              </a>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
