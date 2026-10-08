import { legalDocs } from "@/lib/content";
import { getPricingSettings } from "@/lib/membership";
import ProsePage from "@/components/prose-page";

export const metadata = { title: "Refund Policy" };

export default async function RefundPolicyPage() {
  const settings = await getPricingSettings();
  const doc = legalDocs["refund-policy"];
  const days = String(settings.guarantees.moneyBackDays);

  // The guarantee window lives in pricing settings — the policy always quotes
  // whatever the Super Admin has published.
  const sections = doc.sections.map((section) =>
    section.p ? { ...section, p: section.p.replaceAll("{days}", days) } : section,
  );

  return (
    <ProsePage
      eyebrow="Legal & Help"
      title={doc.title}
      description={doc.intro}
      breadcrumbs={[
        { label: "Home", href: "/" },
        { label: "Legal", href: "/legal" },
        { label: doc.title },
      ]}
      updated={doc.updated}
      intro={doc.intro}
      sections={sections}
      related={[
        { label: "Membership plans", href: "/membership" },
        { label: "Terms of Use", href: "/legal/terms" },
        { label: "Billing in dashboard", href: "/dashboard/settings" },
      ]}
    />
  );
}
