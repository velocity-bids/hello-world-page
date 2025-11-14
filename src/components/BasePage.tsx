import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FeaturedAuctions from "@/components/FeaturedAuctions";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";

export const BasePage = ({ children }) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {children}
      <Footer />
    </div>
  );
};
