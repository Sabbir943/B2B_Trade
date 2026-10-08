import { legalDocs } from "@/lib/content";
import ProsePage from "@/components/prose-page";

export const metadata = { title: "Trust & Safety" };

export default function TrustSafetyPage() {
  const doc = legalDocs["trust-safety"];
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
        { label: "Verification programme", href: "/verification" },
        { label: "Verification badges", href: "/verification-badges" },
        { label: "Report an issue", href: "/contact" },
      ]}
    />
  );
}
