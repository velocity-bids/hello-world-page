import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, HashRouter } from "react-router-dom";
import { AuthModalProvider } from "@/contexts/AuthModalContext";
import { IdVerificationProvider } from "@/contexts/IdVerificationContext";
import { LoginModal } from "@/components/LoginModal";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import VehicleDetail from "./pages/VehicleDetail";
import Auth from "./pages/Auth";
import CreateListing from "./pages/CreateListing";
import EditListing from "./pages/EditListing";
import AdminDashboard from "./pages/AdminDashboard";
import ProfileSettings from "./pages/ProfileSettings";
import MyListings from "./pages/MyListings";
import ReviewListing from "./pages/ReviewListing";
import NotFound from "./pages/NotFound";
import Auctions from "./pages/Auctions";
import Watching from "./pages/Watching";
import About from "./pages/About";
import MyBids from "./pages/MyBids";
import AuthCallback from "./pages/AuthCallback";
import UserProfilePage from "./pages/UserProfile";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthModalProvider>
        <IdVerificationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter basename="/">
              <LoginModal />
              <Routes>
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/" element={<Index />} />
                <Route path="/auctions" element={<Auctions />} />
                <Route path="/vehicle/:id" element={<VehicleDetail />} />
                <Route path="/sell" element={<CreateListing />} />
                <Route path="/edit-listing/:id" element={<EditListing />} />
                <Route path="/review/:id" element={<ReviewListing />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/my-bids" element={<MyBids />} />
                <Route path="/profile" element={<ProfileSettings />} />
                <Route path="/settings" element={<ProfileSettings />} />
                <Route path="/my-listings" element={<MyListings />} />
                <Route path="/watching" element={<Watching />} />
                <Route path="/about" element={<About />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/user/:userId" element={<UserProfilePage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </IdVerificationProvider>
      </AuthModalProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );

export default App;
