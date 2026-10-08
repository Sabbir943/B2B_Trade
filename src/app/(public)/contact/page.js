import { shell } from "@/components/shell";
import { Button, PageHeader, SectionTitle } from "@/components/ui";
import InquiryForm from "@/components/inquiry-form";
import { ClockIcon, MailIcon, MapPinIcon } from "@/components/icons";
import Link from "next/link";

export const metadata = { title: "Contact" };

const channels = [
  {
    title: "Support desk",
    text: "Account, verification and listing questions — typically answered within one working day.",
    detail: "support@alliedoneltd.com",
    icon: MailIcon,
  },
  {
    title: "Sales & sourcing",
    text: "Membership plans, Sourcing Desk briefs and Market Entry engagements.",
    detail: "sales@alliedoneltd.com",
    icon: MailIcon,
  },
  {
    title: "Office",
    text: "AlliedOne Limited · Level 7, Bay's Galleria, Gulshan 1, Dhaka 1212",
    detail: "Sunday–Thursday · 09:00–18:00 BST",
    icon: MapPinIcon,
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Legal & Help"
        title="Contact us"
        description="Reach the right team the first time — support, sales or the market entry desk. Messages stay on-platform where they belong."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Contact" }]}
      />

      <section className={`py-8 sm:py-10 ${shell}`}>
        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <aside className="space-y-4">
            {channels.map((channel) => (
              <div key={channel.title} className="panel p-5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary/10 text-secondary">
                  <channel.icon className="h-5 w-5" />
                </span>
                <p className="mt-3 font-display text-base font-bold text-primary">
                  {channel.title}
                </p>
                <p className="mt-1 text-[13px] leading-6 text-slate-600">
                  {channel.text}
                </p>
                <p className="mt-2 text-[13px] font-semibold text-ink">
                  {channel.detail}
                </p>
              </div>
            ))}

            <div className="panel bg-surface p-5">
              <p className="flex items-center gap-2 text-[13px] font-bold text-primary">
                <ClockIcon className="h-4 w-4 text-secondary" />
                Response hours
              </p>
              <p className="mt-2 text-[13px] leading-6 text-slate-600">
                Sunday–Thursday, 09:00–18:00 BST. Critical trade disputes are
                monitored outside those hours by the on-call officer.
              </p>
            </div>
          </aside>

          <div className="panel p-6 sm:p-8">
            <p className="label-xs">Write to us</p>
            <p className="mt-2 font-display text-xl font-bold text-primary">
              How can we help?
            </p>
            <div className="mt-5">
              <InquiryForm subject="general support" />
            </div>
            <div className="mt-6 rounded-xl border border-slate-200 bg-surface p-4 text-[13px] leading-6 text-slate-600">
              Reporting a suspected listing problem or safety issue? Use the{" "}
              <Link href="/legal/trust-safety" className="font-semibold text-primary hover:underline">
                Trust &amp; Safety
              </Link>{" "}
              routes — they reach the review officers directly.
            </div>
          </div>
        </div>

        <div className="mt-10">
          <SectionTitle
            eyebrow="Quick routes"
            title="Skip the queue"
            action={
              <Button href="/faq" variant="outline" size="sm">
                Browse FAQs
              </Button>
            }
          />
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {[
              { label: "Verification questions", href: "/verification" },
              { label: "Billing & plans", href: "/membership" },
              { label: "Market Entry desk", href: "/market-entry" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="panel flex items-center justify-between p-5 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="font-display text-sm font-bold text-primary">
                  {item.label}
                </span>
                <MailIcon className="h-4 w-4 text-secondary" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
