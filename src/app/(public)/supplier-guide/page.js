import { supplierGuide } from "@/lib/content";
import ProsePage from "@/components/prose-page";

export const metadata = { title: "Supplier Guide" };

export default function SupplierGuidePage() {
  return (
    <ProsePage
      eyebrow="For suppliers"
      title={supplierGuide.title}
      description={supplierGuide.intro}
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Supplier Guide" }]}
      updated="01 October 2026"
      intro={supplierGuide.intro}
      sections={supplierGuide.sections}
      related={[
        { label: "Get verified", href: "/verification" },
        { label: "List products", href: "/dashboard/products" },
        { label: "Membership plans", href: "/membership" },
      ]}
    />
  );
}
