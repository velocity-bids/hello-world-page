import { Outlet } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const Layout = () => (
  <div className="flex min-h-screen flex-col">
    <Navbar />
    <Outlet />
    <Footer />
  </div>
);
