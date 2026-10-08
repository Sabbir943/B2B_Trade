import { legalDocs } from "@/lib/content";
import ProsePage from "@/components/prose-page";

export const metadata = { title: "Product Listing Policy" };

export default function ProductListingPolicyPage() {
  const doc = legalDocs["product-listing-policy"];
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
        { label: "Trust & Safety", href: "/legal/trust-safety" },
        { label: "List products", href: "/dashboard/products" },
        { label: "All categories", href: "/categories" },
      ]}
    />
  );
}
