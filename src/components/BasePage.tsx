import Navbar from "@/components/Navbar";
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
