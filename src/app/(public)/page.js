import HeroBanner from "@/components/hero-banner";
import {
  FeaturedCategories,
  FinalCta,
  HowItWorks,
  LatestInsights,
  LiveRequirements,
  MarketEntryBanner,
  SourcingDesk,
  TrustStrip,
  VerificationBadges,
  VerifiedSuppliers,
} from "@/components/home-sections";

export default function Home() {
  return (
    <>
      <HeroBanner />
      <TrustStrip />
      <FeaturedCategories />
      <LiveRequirements />
      <VerifiedSuppliers />
      <MarketEntryBanner />
      <HowItWorks />
      <SourcingDesk />
      <VerificationBadges />
      <LatestInsights />
      <FinalCta />
    </>
  );
}
