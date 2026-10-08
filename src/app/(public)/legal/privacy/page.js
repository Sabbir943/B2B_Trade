import { legalDocs } from "@/lib/content";
import ProsePage from "@/components/prose-page";

export const metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  const doc = legalDocs.privacy;
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
        { label: "Terms of Use", href: "/legal/terms" },
        { label: "Trust & Safety", href: "/legal/trust-safety" },
        { label: "Contact", href: "/contact" },
      ]}
    />
  );
}
