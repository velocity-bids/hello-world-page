import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import VehicleDetail from "./pages/VehicleDetail";
import Auth from "./pages/Auth";
import CreateListing from "./pages/CreateListing";
import AdminDashboard from "./pages/AdminDashboard";
import ProfileSettings from "./pages/ProfileSettings";
import MyListings from "./pages/MyListings";
import ReviewListing from "./pages/ReviewListing";
import NotFound from "./pages/NotFound";
import Auctions from "./pages/Auctions";
import Watching from "./pages/Watching";
import About from "./pages/About";
import MyBids from "./pages/MyBids";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auctions" element={<Auctions />} />
          <Route path="/vehicle/:id" element={<VehicleDetail />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/sell" element={<CreateListing />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/review/:id" element={<ReviewListing />} />
          <Route path="/profile" element={<ProfileSettings />} />
          <Route path="/my-listings" element={<MyListings />} />
          <Route path="/my-bids" element={<MyBids />} />
          <Route path="/watching" element={<Watching />} />
          <Route path="/about" element={<About />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
