import Navbar from "@/components/Navbar";
import PremiumHero from "@/components/PremiumHero";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <PremiumHero />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
