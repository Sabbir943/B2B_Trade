import { requireAuth } from "@/lib/session";
import { getProfile, completeness, PROFILE_BUSINESS_TYPES } from "@/lib/profile";
import { categories } from "@/lib/catalog";
import OnboardingWizard from "@/components/onboarding-wizard";

export const instant = false;

export const metadata = { title: "Account setup" };

/**
 * §7.1 Registration and onboarding — email OTP already ran during sign-up;
 * this screen collects phone OTP, company details and the trade focus, then
 * shows the completeness meter that drives search ranking.
 */
export default async function OnboardingPage() {
  const { user } = await requireAuth("/onboarding");
  const profile = await getProfile(user.email);

  return (
    <OnboardingWizard
      email={user.email}
      name={user.name || ""}
      profile={profile}
      meter={completeness(profile)}
      businessTypes={PROFILE_BUSINESS_TYPES}
      categories={categories}
    />
  );
}
