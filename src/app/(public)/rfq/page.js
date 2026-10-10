import RfqForm from "@/components/rfq-form";
import { shell } from "@/components/shell";
import { Badge, Button, PageHeader } from "@/components/ui";
import { CheckIcon, InboxIcon } from "@/components/icons";
import { getSessionContext } from "@/lib/session";

export const instant = false;

export const metadata = { title: "Post Your Requirement" };

const perks = [
  "Verified suppliers respond with specs, pricing and lead times",
  "Your email stays private until you choose to reply",
  "One post appears on the board, in search and in matched alerts",
  "No cost for buyers at any membership level",
];

/**
 * §7.3.1 — posting requires a signed-in company account: replies and
 * moderation all key off the account email, so visitors are offered the
 * sign-up path instead of the form.
 */
export default async function RfqPage() {
  const { user } = await getSessionContext();
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
            {user ? (
              <RfqForm />
            ) : (
              <div className="text-center">
                <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/8 text-primary">
                  <InboxIcon className="h-6 w-6" />
                </span>
                <h2 className="mt-4 font-display text-lg font-bold text-primary">
                  Sign in to post a requirement
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                  Quotes, moderation updates and supplier replies are delivered to your
                  account inbox — it takes a minute to create one.
                </p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <Button href="/sign-in?next=/rfq" variant="navy" size="sm">
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

          </aside>
        </div>
      </section>
    </>
  );
}
