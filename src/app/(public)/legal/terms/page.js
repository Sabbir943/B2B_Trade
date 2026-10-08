import { legalDocs } from "@/lib/content";
import ProsePage from "@/components/prose-page";

export const metadata = { title: "Terms of Use" };

export default function TermsPage() {
  const doc = legalDocs.terms;
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
      sections={doc.sections}
      related={[
        { label: "Privacy Policy", href: "/legal/privacy" },
        { label: "Refund Policy", href: "/legal/refund-policy" },
        { label: "Trust & Safety", href: "/legal/trust-safety" },
      ]}
    />
  );
}
