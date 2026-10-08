import { requirements } from "@/lib/catalog";
import { shell } from "@/components/shell";
import { Button, EmptyState, PageHeader, Tabs } from "@/components/ui";
import { RequirementCard } from "@/components/cards";
import { InboxIcon } from "@/components/icons";

export const metadata = { title: "Buy requirements" };

export default function RequirementsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Demand board"
        title="Live buy requirements"
        description="Buyers publish quantities, budgets and target dates. Suppliers respond with pricing, lead times and samples — no cold outreach required."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Requirements" }]}
        actions={
          <>
            <Button href="/supplier-guide" variant="outline">
              How to respond
            </Button>
            <Button href="/rfq" variant="accent">
              Post your requirement
            </Button>
          </>
        }
      />

      <section className={`py-8 sm:py-10 ${shell}`}>
        <Tabs
          active="Open"
          items={[
            { label: "Open", href: "#open" },
            { label: "Closing soon", href: "#closing" },
            { label: "Answered", href: "#answered" },
            { label: "Mine", href: "#mine" },
          ]}
          className="max-w-2xl"
        />

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {requirements.map((item) => (
            <RequirementCard key={item.id} item={item} />
          ))}
        </div>

        <div className="mt-6">
          <EmptyState
            icon={<InboxIcon className="h-5 w-5" />}
            title="New requirements land daily"
            text="Save this board and we will alert you when buyers in your categories publish work."
            action={
              <Button href="/sign-up" variant="navy" size="sm">
                Create a free account
              </Button>
            }
          />
        </div>
      </section>
    </>
  );
}
