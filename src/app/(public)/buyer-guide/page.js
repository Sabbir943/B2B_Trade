import { buyerGuide } from "@/lib/content";
import ProsePage from "@/components/prose-page";
import { Button } from "@/components/ui";

export const metadata = { title: "Buyer Guide" };

export default function BuyerGuidePage() {
  return (
    <ProsePage
      eyebrow="For buyers"
      title={buyerGuide.title}
      description={buyerGuide.intro}
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "Buyer Guide" }]}
      updated="01 October 2026"
      intro={buyerGuide.intro}
      sections={buyerGuide.sections}
      actions={
        <Button href="/rfq" variant="accent">
          Post Your Requirement
        </Button>
      }
      related={[
        { label: "Find suppliers", href: "/suppliers" },
        { label: "Sourcing Desk", href: "/sourcing-service" },
        { label: "Buy requirements", href: "/requirements" },
      ]}
    />
  );
}
