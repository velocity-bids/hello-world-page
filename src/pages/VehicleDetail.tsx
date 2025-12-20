import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { VehicleGallery } from "@/components/VehicleGallery";
import { CommentSection } from "@/components/CommentSection";
import { FeedbackForm } from "@/components/FeedbackForm";
import { BiddingCard, RecentBidsCard, SellerCard, VehicleInfo } from "@/components/vehicle";
import { PageLoader } from "@/components/common";
import { ShareButtons } from "@/components/ShareButtons";
import { ReportModal } from "@/components/ReportModal";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getVehicleById, getRecentBidsForVehicle, fetchUserProfile, enrichWithProfiles } from "@/db/queries";
import { updateVehicleApprovalStatus } from "@/db/mutations";
import { useAuth } from "@/hooks/useAuth";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useAuthModal } from "@/contexts/AuthModalContext";
import { useCountdown } from "@/hooks/useCountdown";
import { useWatchedVehicles } from "@/hooks/useWatchedVehicles";
import { toast } from "sonner";
import { BidHistoryModal } from "@/components/BidHistoryModal";
import { CheckCircle, XCircle, Loader2, Shield } from "lucide-react";
import type { Vehicle as VehicleType, Bid, UserProfile } from "@/types";

interface VehicleWithProfile extends VehicleType {
  profiles?: UserProfile | null;
}

const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { openLoginModal } = useAuthModal();
  const { addToWatchlist, removeFromWatchlist, isWatching } = useWatchedVehicles();
  
  const [vehicle, setVehicle] = useState<VehicleWithProfile | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [winningBidderId, setWinningBidderId] = useState<string | null>(null);
  const [bidAmount, setBidAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [watching, setWatching] = useState(false);
  const [watchLoading, setWatchLoading] = useState(false);
  const [showBidHistory, setShowBidHistory] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [adminSubmitting, setAdminSubmitting] = useState(false);

  const { timeLeft, isEnded } = useCountdown(vehicle?.auction_end_time || null);

  // Check if user is watching this vehicle
  useEffect(() => {
    if (!id || !user) {
      setWatching(false);
      return;
    }

    const checkWatchStatus = async () => {
      const isWatched = await isWatching(id);
      setWatching(isWatched);
    };

    checkWatchStatus();
  }, [id, user, isWatching]);

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
    const startingBid = (vehicle as any).starting_bid || 0;
    const minBid = vehicle.current_bid > 0 ? vehicle.current_bid + 100 : Math.max(startingBid, 100);
    
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

  const handleWatchToggle = async () => {
    if (!user) {
      toast.error("Please sign in to watch auctions");
      openLoginModal();
      return;
    }

    if (!id) return;

    setWatchLoading(true);
    
    if (watching) {
      const success = await removeFromWatchlist(id);
      if (success) setWatching(false);
    } else {
      const success = await addToWatchlist(id);
      if (success) setWatching(true);
    }
    
    setWatchLoading(false);
  };

  const handleAdminAction = async (action: 'approved' | 'declined') => {
    if (!vehicle) return;
    
    setAdminSubmitting(true);
    const { error } = await updateVehicleApprovalStatus(vehicle.id, action, adminNotes || null);
    
    if (error) {
      toast.error(`Failed to ${action === 'approved' ? 'approve' : 'decline'} listing`);
    } else {
      toast.success(`Listing ${action === 'approved' ? 'approved' : 'declined'} successfully`);
      setVehicle(prev => prev ? { ...prev, approval_status: action, admin_notes: adminNotes } : null);
      setAdminNotes("");
    }
    setAdminSubmitting(false);
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
  const startingBid = (vehicle as any).starting_bid || 0;
  const minBid = vehicle.current_bid > 0 ? vehicle.current_bid + 100 : Math.max(startingBid, 100);
  const canShowFeedback = isEnded && winningBidderId && (user?.id === vehicle.seller_id || user?.id === winningBidderId);
  const vehicleTitle = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const vehicleUrl = typeof window !== "undefined" ? window.location.href : "";
  const showAdminPanel = isAdmin && !isOwnListing;
  const approvalStatus = (vehicle as any).approval_status || 'pending';

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
                  vehicleName={vehicleTitle}
                />
              </div>

              {/* Share and Report buttons */}
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <ShareButtons
                  url={vehicleUrl}
                  title={vehicleTitle}
                  description={vehicle.description || `Check out this ${vehicleTitle} auction!`}
                />
                {user && !isOwnListing && (
                  <ReportModal vehicleId={vehicle.id} vehicleTitle={vehicleTitle} />
                )}
              </div>

              <VehicleInfo
                vehicle={vehicle}
                isActive={vehicle.status === "active"}
              />

              {vehicle.description && (
                <Card className="my-6 p-6">
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
                  onWatchToggle={handleWatchToggle}
                  submitting={submitting}
                  watching={watching}
                  watchLoading={watchLoading}
                  minBid={minBid}
                  isActive={vehicle.status === "active"}
                />

                <SellerCard sellerId={vehicle.seller_id} profile={vehicle.profiles} />

                {/* Admin Actions Panel */}
                {showAdminPanel && (
                  <Card className="border-primary/20 bg-primary/5 p-6">
                    <div className="mb-4 flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">Admin Actions</h3>
                    </div>
                    
                    <div className="mb-4 flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge 
                        variant={
                          approvalStatus === 'approved' ? 'default' : 
                          approvalStatus === 'declined' ? 'destructive' : 
                          'secondary'
                        }
                      >
                        {approvalStatus.charAt(0).toUpperCase() + approvalStatus.slice(1)}
                      </Badge>
                    </div>

                    {(vehicle as any).admin_notes && (
                      <div className="mb-4 rounded-md bg-muted p-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Admin Notes:</p>
                        <p className="text-sm">{(vehicle as any).admin_notes}</p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <Textarea
                        placeholder="Add admin notes..."
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        rows={3}
                        className="bg-background"
                      />
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAdminAction('approved')}
                          disabled={adminSubmitting || approvalStatus === 'approved'}
                          className="flex-1"
                          size="sm"
                        >
                          {adminSubmitting ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle className="mr-1 h-4 w-4" />
                          )}
                          Approve
                        </Button>
                        <Button
                          onClick={() => handleAdminAction('declined')}
                          disabled={adminSubmitting || approvalStatus === 'declined'}
                          variant="destructive"
                          className="flex-1"
                          size="sm"
                        >
                          {adminSubmitting ? (
                            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                          ) : (
                            <XCircle className="mr-1 h-4 w-4" />
                          )}
                          Decline
                        </Button>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => navigate('/admin')}
                      >
                        Back to Dashboard
                      </Button>
                    </div>
                  </Card>
                )}

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
