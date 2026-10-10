import ProductsWorkspace from "@/components/products-workspace";
import { Button } from "@/components/ui";
import { WorkspaceHeader } from "@/components/workspace";
import { requirePermission } from "@/lib/session";
import { getListingsBySeller, listingAllowance } from "@/lib/listings";
import { getProfile } from "@/lib/profile";
import { categories } from "@/lib/catalog";
import { plain } from "@/lib/refs";

export const instant = false;

export const metadata = { title: "Products" };

/**
 * §7.2 — the member's real listings, plan allowance and the inline
 * moderation-aware listing form.
 */
export default async function ProductsPage() {
  const { user, tier } = await requirePermission("member.products");
  const profile = await getProfile(user.email);
  const listings = await getListingsBySeller(user.email);
  const allowance = await listingAllowance(user.email, tier);

  return (
    <>
      <WorkspaceHeader
        title="Products"
        description="Everything you have listed — live, draft and under review. Keep specs, MOQ and packing current to stay ranked."
        actions={
          <Button href="/dashboard/verification" variant="outline" size="sm">
            Verification status
          </Button>
        }
      />

      <ProductsWorkspace
        listings={plain(listings)}
        allowance={plain(allowance)}
        categories={categories}
        currency={profile.currency || "USD"}
        origin={profile.country || "Bangladesh"}
      />
    </>
  );
}
