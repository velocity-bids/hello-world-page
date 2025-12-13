import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { VehicleGallery } from "@/components/VehicleGallery";
import { CommentSection } from "@/components/CommentSection";
import { FeedbackForm } from "@/components/FeedbackForm";
import { BiddingCard, RecentBidsCard, SellerCard, VehicleInfo } from "@/components/vehicle";
import { PageLoader } from "@/components/common";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getVehicleById, getRecentBidsForVehicle, fetchUserProfile, enrichWithProfiles } from "@/db/queries";
import { useAuth } from "@/hooks/useAuth";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useCountdown } from "@/hooks/useCountdown";
import { toast } from "sonner";
import { BidHistoryModal } from "@/components/BidHistoryModal";
import type { Vehicle as VehicleType, Bid, UserProfile } from "@/types";

interface VehicleWithProfile extends VehicleType {
  profiles?: UserProfile | null;
}

const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openLoginModal } = useAuthModal();
  
  const [vehicle, setVehicle] = useState<VehicleWithProfile | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [winningBidderId, setWinningBidderId] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [watching, setWatching] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);
  const [showBidHistory, setShowBidHistory] = useState(false);

  const { timeLeft, isEnded } = useCountdown(vehicle?.auction_end_time || null);

  // Fetch vehicle data
  useEffect(() => {
    if (!id) return;

    const fetchVehicle = async () => {
      const { data, error } = await getVehicleById(id);

      if (error || !data) {
        if (import.meta.env.DEV) {
          console.error("Error fetching vehicle:", error);
        }
        toast.error("Failed to load auction");
        navigate("/");
        return;
      }

      const sellerProfile = await fetchUserProfile(data.seller_id);
      setVehicle({ ...data, profiles: sellerProfile });
      setLoading(false);
    };

    fetchVehicle();
  }, [id, navigate]);

  // Fetch bids (latest 3 only) and winning bidder
  useEffect(() => {
    if (!id) return;

    const fetchBids = async () => {
      const { data, error } = await getRecentBidsForVehicle(id, 3);

      if (error) {
        if (import.meta.env.DEV) {
          console.error("Error fetching bids:", error);
        }
        return;
      }

      if (data && data.length > 0) {
        setWinningBidderId(data[0].bidder_id);
      }

      const bidsWithProfiles = await enrichWithProfiles(data, (bid) => bid.bidder_id);
      setBids(bidsWithProfiles);
    };

    fetchBids();
  }, [id]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!id) return;

    const vehicleChannel = supabase
      .channel(`vehicle-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "vehicles",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setVehicle((prev) => prev ? { ...prev, ...payload.new } : null);
        }
      )
      .subscribe();

    const bidsChannel = supabase
      .channel(`bids-${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bids",
          filter: `vehicle_id=eq.${id}`,
        },
        async (payload) => {
          const profileData = await fetchUserProfile((payload.new as Bid).bidder_id);
          const newBid = { ...payload.new as Bid, profiles: profileData };
          setBids((prev) => [newBid, ...prev].slice(0, 3));
          toast.success("New bid placed!", {
            description: `$${(payload.new as Bid).amount.toLocaleString()}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(vehicleChannel);
      supabase.removeChannel(bidsChannel);
    };
  }, [id]);

  const handlePlaceBid = async () => {
    if (!user) {
      toast.error("Please sign in to place a bid");
      openLoginModal();
      return;
    }

    if (!bidAmount || !vehicle) return;

    const amount = parseFloat(bidAmount);
    const minBid = vehicle.current_bid > 0 ? vehicle.current_bid + 100 : 100;
    
    if (amount < minBid) {
      toast.error(`Minimum bid is $${minBid.toLocaleString()}`);
      return;
    }

    setSubmitting(true);

    const { data, error } = await supabase.rpc("place_bid", {
      p_vehicle_id: vehicle.id,
      p_amount: amount,
    });

    if (error) {
      toast.error("Failed to place bid. Please try again.");
    } else if (data && typeof data === "object" && "error" in data && data.error) {
      toast.error(String(data.error));
    } else {
      toast.success("Bid placed successfully!");
      setBidAmount("");
    }

    setSubmitting(false);
  };

  const handleQuickBid = (increment: number) => {
    setBidAmount(String((vehicle?.current_bid || 0) + increment));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex flex-1 items-center justify-center">
          <PageLoader message="Loading auction..." />
        </main>
        <Footer />
      </div>
    );
  }

  if (!vehicle) return null;

  const isOwnListing = user?.id === vehicle.seller_id;
  const reserveMet = vehicle.reserve_price ? vehicle.current_bid >= vehicle.reserve_price : false;
  const minBid = vehicle.current_bid > 0 ? vehicle.current_bid + 100 : 100;
  const canShowFeedback = isEnded && winningBidderId && (user?.id === vehicle.seller_id || user?.id === winningBidderId);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <VehicleGallery
                  images={vehicle.images && vehicle.images.length > 0 
                    ? vehicle.images 
                    : [vehicle.image_url || "/placeholder.svg"]
                  }
                  vehicleName={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                />
              </div>

              <VehicleInfo
                year={vehicle.year}
                make={vehicle.make}
                model={vehicle.model}
                mileage={vehicle.mileage}
                vin={vehicle.vin}
                isActive={vehicle.status === "active"}
              />

              {vehicle.description && (
                <Card className="mb-6 p-6">
                  <h2 className="mb-4 text-2xl font-semibold">Description</h2>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {vehicle.description}
                  </p>
                </Card>
              )}

              <CommentSection vehicleId={vehicle.id} />
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-20 space-y-6">
                <BiddingCard
                  currentBid={vehicle.current_bid}
                  bidCount={vehicle.bid_count}
                  timeLeft={timeLeft}
                  isEnded={isEnded}
                  reservePrice={vehicle.reserve_price}
                  reserveMet={reserveMet}
                  isOwnListing={isOwnListing}
                  bidAmount={bidAmount}
                  onBidAmountChange={setBidAmount}
                  onPlaceBid={handlePlaceBid}
                  onQuickBid={handleQuickBid}
                  onWatchToggle={() => console.log("watch toggle")}
                  submitting={submitting}
                  watching={watching}
                  watchLoading={watchLoading}
                  minBid={minBid}
                  isActive={vehicle.status === "active"}
                />

                <SellerCard sellerId={vehicle.seller_id} profile={vehicle.profiles} />

                {canShowFeedback && (
                  <FeedbackForm
                    vehicleId={vehicle.id}
                    sellerId={vehicle.seller_id}
                    winningBidderId={winningBidderId}
                  />
                )}

                <RecentBidsCard bids={bids} onViewAll={() => setShowBidHistory(true)} />
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <BidHistoryModal
        vehicleId={vehicle.id}
        isOpen={showBidHistory}
        onClose={() => setShowBidHistory(false)}
      />
    </div>
  );
};

export default VehicleDetail;
