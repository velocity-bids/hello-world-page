import PremiumHero from "@/components/PremiumHero";
import HowItWorks from "@/components/HowItWorks";
import FeaturedAuctions from "@/components/FeaturedAuctions";

const Index = () => {
  return (
    <main className="flex-1">
      <PremiumHero />
      <FeaturedAuctions />
      <HowItWorks />
    </main>
  );
};

export default Index;
